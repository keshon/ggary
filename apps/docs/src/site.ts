import type { NavGroup } from '@ggary/core/nav'
import { MANIFEST, PAGES, type DocPage } from './manifest'

/**
 * What the site's chrome knows before a framework draws it: the mark, the two
 * frameworks, the route and the navigation. React and Svelte each draw the
 * chrome with their own components from these.
 */

/** Two G's, one inside the other, sharing a crossbar. */
export const LOGO = `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="butt" stroke-linejoin="miter" aria-hidden="true">
  <path d="M19.11 4.41 A12 12 0 1 0 28 16 H16" />
  <path d="M17.55 10.20 A6 6 0 1 0 22 16" />
</svg>`

export const FRAMEWORKS = [
  { value: 'react', label: 'React', href: '/react.html' },
  { value: 'svelte', label: 'Svelte', href: '/svelte.html' },
]

/** The same page in the other framework. */
export function goToFramework(value: string): void {
  const framework = FRAMEWORKS.find((candidate) => candidate.value === value)
  if (framework && !location.pathname.endsWith(framework.href)) location.href = framework.href + location.hash
}

/** A route starts #/; any other hash is a place on the page being read. */
const isRoute = (hash: string) => hash === '' || hash.startsWith('#/')

/** The page the route names: #/button. An unknown or empty route is the first page. */
export function currentPage(): DocPage {
  const id = location.hash.replace(/^#\/?/, '')
  return PAGES.find((page) => page.id === id) ?? PAGES[0]
}

export function onRouteChange(listener: (page: DocPage) => void): () => void {
  const handle = () => {
    if (!isRoute(location.hash)) return
    listener(currentPage())
    window.scrollTo(0, 0)
  }
  window.addEventListener('hashchange', handle)
  return () => window.removeEventListener('hashchange', handle)
}

/** The navigation, from the manifest, with the page being read marked. */
export function navGroups(current: DocPage): NavGroup[] {
  return MANIFEST.map((group) => ({
    label: group.title,
    items: group.pages.map((page) => ({ label: page.title, href: `#/${page.id}`, current: page.id === current.id })),
  }))
}

/**
 * A page opens at its top with nothing focused. What a page shows open on
 * load — a dialog, a popover — takes the focus as it opens, as it should in an
 * app, and the browser scrolls to it; here it is only on show.
 */
export function settlePage(): void {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const active = document.activeElement
      if (active instanceof HTMLElement && active.closest('.page')) active.blur()
      window.scrollTo(0, 0)
    })
  )
}

/** The fixed sections every page has, in this order, when it has them. */
export const SECTIONS = [
  { key: 'variants', title: 'Variants' },
  { key: 'sizes', title: 'Sizes' },
  { key: 'states', title: 'States' },
  { key: 'composition', title: 'Composition' },
] as const
export type SectionKey = (typeof SECTIONS)[number]['key']
