/**
 * The sandbox's own chrome: the bar at the top and the navigator of sections.
 * The same on all three pages, and built from the kit's custom elements, which
 * run on any page — so what differs below it is the components' doing, and the
 * chrome is one more place the kit is used for real.
 */
// Only the four elements it uses: the React and Svelte pages carry no others.
import '@ggary/elements/components/button/button.element'
import '@ggary/elements/components/nav/nav.element'
import '@ggary/elements/components/segmented-control/segmented-control.element'
import type { GgSelectElement } from '@ggary/elements/components/select/select.element'
import '@ggary/elements/components/select/select.element'
import { onThemeChange, setAxis, setTheme, themeChoices } from './theme'

/**
 * The mark: two G's, one inside the other, sharing a crossbar. Their openings
 * are wide and their ends cut square, so the pair reads as letters and not as
 * an "@".
 */
export const LOGO = `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="butt" stroke-linejoin="miter" aria-hidden="true">
  <path d="M19.11 4.41 A12 12 0 1 0 28 16 H16" />
  <path d="M17.55 10.20 A6 6 0 1 0 22 16" />
</svg>`

const PAGES = [
  { value: 'vanilla', label: 'Vanilla', href: '/index.html' },
  { value: 'react', label: 'React', href: '/react.html' },
  { value: 'svelte', label: 'Svelte', href: '/svelte.html' },
]
const here = PAGES.find((page) => location.pathname.endsWith(page.href)) ?? PAGES[0]

const escape = (text: string) => text.replace(/[&<>"]/g, (char) => `&#${char.charCodeAt(0)};`)
const capital = (text: string) => text[0].toUpperCase() + text.slice(1)

function buildBar(bar: HTMLElement) {
  bar.innerHTML = `
    <a class="brand" href="#" aria-label="GGary UI, to the top">${LOGO}<span class="wordmark">GGary</span></a>
    <gg-segmented-control class="frameworks" label="Framework" size="sm">
      ${PAGES.map((page) => `<label><input type="radio" name="framework" value="${page.value}"${page === here ? ' checked' : ''}> ${page.label}</label>`).join('')}
    </gg-segmented-control>
    <div class="theme-controls"></div>`
  bar.querySelector('gg-segmented-control')!.addEventListener('valuechange', (event) => {
    const page = PAGES.find((candidate) => candidate.value === (event as CustomEvent<{ value: string }>).detail.value)
    // The same section on the other page, where it has the same id.
    if (page && page !== here) location.href = page.href + location.hash
  })
  const controls = bar.querySelector<HTMLElement>('.theme-controls')!
  const draw = () => {
    // The select the change came from is drawn anew: the keyboard goes back to it.
    const focused = controls.querySelector<HTMLElement>(':focus')?.closest('gg-select')?.getAttribute('label')
    const choices = themeChoices()
    const select = (label: string, items: { value: string; label: string }[], value: string, onChange: (value: string) => void) => {
      const element = document.createElement('gg-select') as GgSelectElement
      element.setAttribute('label', label)
      element.setAttribute('value', value)
      element.items = items
      element.addEventListener('valuechange', (event) => {
        const next = (event as CustomEvent<{ value: string | null }>).detail.value
        if (next !== null && next !== value) onChange(next)
      })
      return element
    }
    controls.replaceChildren(
      select('Theme', choices.themes, choices.theme, setTheme),
      ...choices.axes.map((axis) =>
        select(capital(axis.label), axis.values.map((value) => ({ value, label: capital(value) })), axis.value, (value) => setAxis(axis.attr, value))
      )
    )
    if (focused) controls.querySelector<HTMLElement>(`gg-select[label="${focused}"] [data-part="trigger"]`)?.focus()
  }
  draw()
  onThemeChange(draw)
}

/** A section's name: its first heading. */
const titleOf = (section: HTMLElement) => section.querySelector(':scope > h2')?.textContent?.trim() ?? ''
const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '')

/**
 * The navigator: every section, numbered as its heading is, the one being
 * read marked. Beside the page where there is room for it; elsewhere a
 * popover opened from a button that says where you are.
 */
let stopNavigator: (() => void) | null = null
/** The bar's height as drawn: it takes two lines on a narrow screen. */
const bar = () => document.getElementById('chrome')?.getBoundingClientRect().height ?? 0

function buildNavigator(sections: HTMLElement[]) {
  stopNavigator?.()
  document.getElementById('toc')?.remove()
  document.getElementById('toc-button')?.remove()
  const used = new Set<string>()
  for (const section of sections) {
    if (!section.id) section.id = slug(titleOf(section)) || 'section'
    let id = section.id
    for (let n = 2; used.has(id); n += 1) id = `${section.id}-${n}`
    section.id = id
    used.add(id)
  }
  const number = (index: number) => String(index + 1).padStart(2, '0')
  const toc = document.createElement('aside')
  toc.id = 'toc'
  toc.className = 'toc'
  toc.setAttribute('popover', '')
  toc.innerHTML = `<p class="toc-title">On this page</p>
    <gg-nav label="Sections"><div>${sections.map((section, index) => `<a href="#${section.id}"><span class="toc-number" aria-hidden="true">${number(index)}</span>${escape(titleOf(section))}</a>`).join('')}</div></gg-nav>`
  const button = document.createElement('gg-button')
  button.id = 'toc-button'
  button.className = 'toc-button'
  button.setAttribute('emphasis', 'high')
  button.innerHTML = `<button type="button" popovertarget="toc"><span data-icon="list" aria-hidden="true"></span><span class="visually-hidden">Sections: </span><span class="toc-current"></span></button>`
  document.body.append(toc, button)

  const links = [...toc.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')]
  toc.addEventListener('click', (event) => {
    if ((event.target as Element).closest('a') && toc.matches(':popover-open')) toc.hidePopover()
  })

  let current = -1
  const mark = () => {
    // The section being read: the last whose top has passed a third of the way down.
    const line = Math.max(bar(), window.innerHeight / 4)
    let index = 0
    sections.forEach((section, i) => {
      if (section.getBoundingClientRect().top <= line) index = i
    })
    // At the very bottom the last section is being read, however short it is.
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) index = sections.length - 1
    if (index === current) return
    current = index
    // The nav's current item, as it would draw it: the element takes it from the
    // markup, and here the markup follows the reading.
    links.forEach((link, i) => {
      if (i === index) {
        link.setAttribute('aria-current', 'location')
        link.setAttribute('data-current', '')
      } else {
        link.removeAttribute('aria-current')
        link.removeAttribute('data-current')
      }
    })
    const link = links[index]
    if (link && toc.scrollHeight > toc.clientHeight) {
      const top = link.offsetTop - toc.clientHeight / 2 + link.offsetHeight / 2
      toc.scrollTo({ top, behavior: 'auto' })
    }
    button.querySelector('.toc-current')!.textContent = `${number(index)} · ${titleOf(sections[index])}`
  }
  let frame = 0
  const schedule = () => {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(mark)
  }
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule)
  stopNavigator = () => {
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
  }
  mark()
}

/** The sections the framework drew: the top-level ones with a heading. */
const sectionsOf = (app: HTMLElement) =>
  [...app.querySelectorAll<HTMLElement>('section')].filter((section) => !section.parentElement?.closest('section') && section.querySelector(':scope > h2'))

function start() {
  const header = document.getElementById('chrome')
  if (header) {
    buildBar(header)
    // A section scrolled to lands under the bar, however tall it is now.
    new ResizeObserver(() => document.documentElement.style.setProperty('--chrome-height', `${Math.ceil(bar())}px`)).observe(header)
  }
  const app = document.getElementById('app')
  if (!app) return
  // The frameworks draw the page after this runs: build once their sections are there, and again if they change.
  let count = -1
  let timer = 0
  const check = () => {
    const sections = sectionsOf(app)
    if (sections.length === count) return
    count = sections.length
    if (count > 0) buildNavigator(sections)
  }
  // Looked at a moment after a change, not after the last: a busy page never stops changing.
  new MutationObserver(() => {
    if (!timer) timer = window.setTimeout(() => ((timer = 0), check()), 150)
  }).observe(app, { childList: true, subtree: true })
  check()
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start)
else start()
