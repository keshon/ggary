import type { NavGroup } from '@ggary/core/nav'
import { SITEMAP, type SiteCategory, type SiteComponent } from './sitemap'

/**
 * What the sandbox's chrome knows before any framework draws it: the mark,
 * the pages, the sections a page has and which one is being read. Each page
 * draws the bar and the navigator with its own components — Chrome.tsx on the
 * React page, Chrome.svelte on the Svelte one — from these.
 */

/**
 * The mark: two G's, one inside the other, sharing a crossbar. Their openings
 * are wide and their ends cut square, so the pair reads as letters and not as
 * an "@".
 */
export const LOGO = `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="butt" stroke-linejoin="miter" aria-hidden="true">
  <path d="M19.11 4.41 A12 12 0 1 0 28 16 H16" />
  <path d="M17.55 10.20 A6 6 0 1 0 22 16" />
</svg>`

export const PAGES = [
  { value: 'react', label: 'React', href: '/react.html' },
  { value: 'svelte', label: 'Svelte', href: '/svelte.html' },
]

/** To the same section on the other page, where it has the same id. */
export function goToPage(value: string): void {
  const page = PAGES.find((candidate) => candidate.value === value)
  if (page && !location.pathname.endsWith(page.href)) location.href = page.href + location.hash
}

/** Where the reading is: the anchor being read, its component and its category. */
export interface Reading {
  anchor: string
  component: SiteComponent
  category: SiteCategory
  /** The variant's name, when the component has several. */
  variant: string | null
}

/** Every anchor on the page, in reading order, with what it belongs to. */
export const READING_ORDER: Reading[] = SITEMAP.flatMap((category) =>
  category.components.flatMap((component) =>
    component.anchors.map((anchor) => ({ anchor: anchor.id, component, category, variant: component.anchors.length > 1 ? anchor.label : null }))
  )
)

/** The navigator's groups for the kit's Nav: a category a group, a component an item, its variants its sections. */
export function navGroups(current: string | null): NavGroup[] {
  const link = (id: string) => `#${id}`
  return SITEMAP.map((category) => ({
    label: category.title,
    items: category.components.map((component) =>
      component.anchors.length === 1
        ? { label: component.label, href: link(component.anchors[0].id), current: component.anchors[0].id === current }
        : {
            label: component.label,
            href: link(component.anchors[0].id),
            items: component.anchors.map((anchor) => ({ label: anchor.label ?? component.label, href: link(anchor.id), current: anchor.id === current })),
          }
    ),
  }))
}

/** The corner button's words: "Actions · Button — Sizes and states". */
export const readingLabel = (reading: Reading | undefined) =>
  reading ? `${reading.category.title} · ${reading.component.label}${reading.variant ? ` — ${reading.variant}` : ''}` : ''

/** The bar's height as drawn: it takes two lines on a narrow screen. */
const barHeight = () => document.getElementById('chrome')?.getBoundingClientRect().height ?? 0

/**
 * The section being read, by index: the last whose top has reached the bar —
 * a link lands its section just under it, so the one clicked is the one
 * marked, however short — or the last at the very bottom.
 */
export function watchReading(ids: string[], onChange: (index: number) => void): () => void {
  let current = -1
  let frame = 0
  const mark = () => {
    const line = barHeight() + 16
    let index = 0
    ids.forEach((id, i) => {
      const top = document.getElementById(id)?.getBoundingClientRect().top
      if (top !== undefined && top <= line) index = i
    })
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) index = ids.length - 1
    if (index === current) return
    current = index
    onChange(index)
  }
  const schedule = () => {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(mark)
  }
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule)
  mark()
  return () => {
    cancelAnimationFrame(frame)
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
  }
}

/** A section scrolled to lands under the bar, however tall it is now. */
export function watchBar(): () => void {
  const bar = document.getElementById('chrome')
  if (!bar) return () => {}
  const observer = new ResizeObserver(() => document.documentElement.style.setProperty('--chrome-height', `${Math.ceil(barHeight())}px`))
  observer.observe(bar)
  return () => observer.disconnect()
}

/** Keep the item being read in view in the navigator's own scroll, without moving the page. */
export function revealInList(list: HTMLElement | null): void {
  const item = list?.querySelector<HTMLElement>('[aria-current="page"]')
  if (!list || !item || list.scrollHeight <= list.clientHeight) return
  list.scrollTo({ top: item.offsetTop - list.clientHeight / 2 + item.offsetHeight / 2 })
}
