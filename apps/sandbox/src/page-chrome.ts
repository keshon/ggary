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

export interface PageSection {
  id: string
  title: string
}

/** A section's name: its first heading. */
const titleOf = (section: HTMLElement) => section.querySelector(':scope > h2')?.textContent?.trim() ?? ''
const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '')

/** The sections the framework drew: the top-level ones with a heading, each given an id if it had none. */
function sectionsOf(app: HTMLElement): PageSection[] {
  const used = new Set<string>()
  return [...app.querySelectorAll<HTMLElement>('section')]
    .filter((section) => !section.parentElement?.closest('section') && section.querySelector(':scope > h2'))
    .map((section) => {
      if (!section.id) section.id = slug(titleOf(section)) || 'section'
      let id = section.id
      for (let n = 2; used.has(id); n += 1) id = `${section.id}-${n}`
      section.id = id
      used.add(id)
      return { id, title: titleOf(section) }
    })
}

/**
 * The page's sections, now and whenever their number changes: the framework
 * draws the page after this starts. Looked at a moment after a change, not
 * after the last — a busy page never stops changing.
 */
export function watchSections(app: HTMLElement, onChange: (sections: PageSection[]) => void): () => void {
  let count = -1
  let timer = 0
  const check = () => {
    const sections = sectionsOf(app)
    if (sections.length === count) return
    count = sections.length
    onChange(sections)
  }
  const observer = new MutationObserver(() => {
    if (!timer) timer = window.setTimeout(() => ((timer = 0), check()), 150)
  })
  observer.observe(app, { childList: true, subtree: true })
  check()
  return () => {
    observer.disconnect()
    clearTimeout(timer)
  }
}

/** The bar's height as drawn: it takes two lines on a narrow screen. */
const barHeight = () => document.getElementById('chrome')?.getBoundingClientRect().height ?? 0

/** The section being read, by index: the last whose top has passed a quarter of the way down, or the last at the very bottom. */
export function watchReading(ids: string[], onChange: (index: number) => void): () => void {
  let current = -1
  let frame = 0
  const mark = () => {
    const line = Math.max(barHeight(), window.innerHeight / 4)
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
export function revealInList(list: HTMLElement | null, index: number): void {
  const item = list?.querySelectorAll<HTMLElement>('[data-part="item"]')[index]
  if (!list || !item || list.scrollHeight <= list.clientHeight) return
  list.scrollTo({ top: item.offsetTop - list.clientHeight / 2 + item.offsetHeight / 2 })
}
