/**
 * Sandbox-only theme switcher.
 *
 * In a real project a theme is chosen per project: one stylesheet, imported
 * once. The sandbox swaps languages at RUNTIME purely so the same page can be
 * compared across them, so each theme is imported as a string (`?inline`) and
 * exactly one is mounted into a <style> element at a time. Loading both at once
 * would make them fight over the same [data-scope] selectors.
 *
 * Within a theme, the axes are plain attributes on <html> — that part IS how a
 * project would use them.
 */
import ggarryCss from '@ggary/theme-ggarry?inline'
import instrumentCss from '@ggary/theme-instrument?inline'

type Axis = { attr: string; label: string; values: string[]; fallback: string }

interface ThemeDef {
  label: string
  css: string
  axes: Axis[]
}

const THEMES: Record<string, ThemeDef> = {
  ggarry: {
    label: 'GGarry',
    css: ggarryCss,
    axes: [{ attr: 'data-mode', label: 'mode', values: ['system', 'light', 'dark'], fallback: 'system' }],
  },
  instrument: {
    label: 'Instrument',
    css: instrumentCss,
    axes: [
      {
        attr: 'data-mode',
        label: 'mode',
        values: ['system', 'light-neutral', 'light', 'light-cool', 'dark', 'dark-soft'],
        fallback: 'system',
      },
      { attr: 'data-accent', label: 'accent', values: ['petrol', 'graphite', 'indigo', 'clay'], fallback: 'petrol' },
      { attr: 'data-density', label: 'density', values: ['compact', 'regular', 'comfortable'], fallback: 'regular' },
      { attr: 'data-scale', label: 'scale', values: ['14', '15', '16', '17', '18'], fallback: '14' },
    ],
  },
}

// Every attribute any theme uses, so switching theme clears the other's.
const ALL_ATTRS = [...new Set(Object.values(THEMES).flatMap((t) => t.axes.map((a) => a.attr)))]

const STORAGE_KEY = 'ggary-sandbox-theme'

type Settings = { theme: string; axes: Record<string, string> }

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Settings
      if (parsed.theme in THEMES) return parsed
    }
  } catch {
    /* storage unavailable: fall through to defaults */
  }
  return { theme: 'ggarry', axes: {} }
}

function save(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    /* non-essential */
  }
}

let settings = load()

function styleElement(): HTMLStyleElement {
  let el = document.getElementById('gg-theme') as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = 'gg-theme'
    document.head.prepend(el)
  }
  return el
}

function apply(): void {
  const theme = THEMES[settings.theme]
  const root = document.documentElement

  styleElement().textContent = theme.css
  root.dataset.ggTheme = settings.theme

  for (const attr of ALL_ATTRS) root.removeAttribute(attr)
  for (const axis of theme.axes) {
    const value = settings.axes[`${settings.theme}:${axis.attr}`] ?? axis.fallback
    // The fallback is the theme's own default: expressing it as "no attribute"
    // is exactly what a project would ship, and it proves the defaults work.
    if (value !== axis.fallback) root.setAttribute(axis.attr, value)
  }
}

function select(label: string, options: [string, string][], current: string, onChange: (v: string) => void) {
  const wrap = document.createElement('label')
  wrap.className = 'control'
  const caption = document.createElement('span')
  caption.textContent = label
  const input = document.createElement('select')
  for (const [value, text] of options) {
    const option = document.createElement('option')
    option.value = value
    option.textContent = text
    option.selected = value === current
    input.append(option)
  }
  input.addEventListener('change', () => onChange(input.value))
  wrap.append(caption, input)
  return wrap
}

function renderControls(): void {
  const host = document.getElementById('theme-controls')
  if (!host) return
  const theme = THEMES[settings.theme]

  const controls = [
    select(
      'theme',
      Object.entries(THEMES).map(([id, t]) => [id, t.label]),
      settings.theme,
      (next) => {
        settings = { ...settings, theme: next }
        commit()
      }
    ),
    ...theme.axes.map((axis) =>
      select(
        axis.label,
        axis.values.map((v) => [v, v]),
        settings.axes[`${settings.theme}:${axis.attr}`] ?? axis.fallback,
        (next) => {
          settings = { ...settings, axes: { ...settings.axes, [`${settings.theme}:${axis.attr}`]: next } }
          commit()
        }
      )
    ),
  ]
  host.replaceChildren(...controls)
}

function commit(): void {
  save(settings)
  apply()
  renderControls()
}

apply()
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderControls)
else renderControls()
