/**
 * The docs' theme: GGarry, imported once as a project would, and its
 * colour mode — a plain attribute on <html>, which is how a project would set
 * it too. "system" is no attribute at all: the theme follows the platform.
 */
import '@ggary/theme-ggarry'

export type Mode = 'system' | 'light' | 'dark'
export const MODES: Mode[] = ['system', 'light', 'dark']

const STORAGE_KEY = 'ggary-docs-mode'

function load(): Mode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && (MODES as string[]).includes(stored)) return stored as Mode
  } catch {
    /* storage unavailable: the default */
  }
  return 'system'
}

let mode = load()
const listeners = new Set<(mode: Mode) => void>()

function apply(): void {
  const root = document.documentElement
  if (mode === 'system') root.removeAttribute('data-mode')
  else root.setAttribute('data-mode', mode)
}

export const getMode = () => mode

export function setMode(next: Mode): void {
  if (next === mode) return
  mode = next
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    /* non-essential */
  }
  apply()
  for (const listener of listeners) listener(mode)
}

/** Called after every change of mode — the bar's control and the command palette's both change it. */
export function onModeChange(listener: (mode: Mode) => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

apply()
