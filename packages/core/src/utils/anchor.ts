import { trackDismissable } from './dismissable'

export interface ScrollSpyOptions {
  /** How far below the window's top a section counts as reached, in px. */
  offset?: number
  /** The section being read changed: its href. */
  onChange: (href: string) => void
}

/**
 * Follows the reading down the page: the section being read is the last whose
 * top has reached the line `offset` px under the window's top (with a little
 * slack, so the section a link lands under a bar counts as reached, however
 * short it is), or the last of all once the page is at its end. Before any is
 * reached, the first. Measured once a frame at most, on scroll and resize.
 */
export function watchScrollSpy(doc: Document, hrefs: string[], options: ScrollSpyOptions): () => void {
  const view = doc.defaultView
  const ids = hrefs.filter((href) => href.startsWith('#') && href.length > 1).map((href) => decodeURIComponent(href.slice(1)))
  if (!view || ids.length === 0) return () => {}
  let reported: string | null = null
  let frame = 0

  const mark = () => {
    const line = (options.offset ?? 0) + 16
    let index = 0
    ids.forEach((id, i) => {
      const top = doc.getElementById(id)?.getBoundingClientRect().top
      if (top !== undefined && top <= line) index = i
    })
    const root = doc.documentElement
    if (root.scrollHeight > view.innerHeight && view.innerHeight + view.scrollY >= root.scrollHeight - 2) index = ids.length - 1
    const href = `#${ids[index]}`
    if (href === reported) return
    reported = href
    options.onChange(href)
  }
  const schedule = () => {
    view.cancelAnimationFrame(frame)
    frame = view.requestAnimationFrame(mark)
  }
  view.addEventListener('scroll', schedule, { passive: true })
  view.addEventListener('resize', schedule)
  mark()
  return () => {
    view.cancelAnimationFrame(frame)
    view.removeEventListener('scroll', schedule)
    view.removeEventListener('resize', schedule)
  }
}

/** Whether a media query matches now, and each time that changes. No matchMedia (an old test environment): never. */
export function watchMedia(doc: Document, query: string | null, onChange: (matches: boolean) => void): () => void {
  const list = query ? doc.defaultView?.matchMedia?.(query) : undefined
  if (!list) return () => {}
  const changed = () => onChange(list.matches)
  onChange(list.matches)
  list.addEventListener('change', changed)
  return () => list.removeEventListener('change', changed)
}

/**
 * A folded anchor's open list, kept while it is open. Call on open; the
 * returned function on close. Escape and a press outside close it; Escape
 * gives the focus back to the button, since the list it was in is gone.
 */
export function attachAnchorPanel(panel: HTMLElement, trigger: HTMLElement | null, onDismiss: () => void): () => void {
  return trackDismissable(panel, {
    exclude: [trigger],
    onDismiss: (reason) => {
      onDismiss()
      if (reason === 'escape' && trigger?.isConnected) trigger.focus({ preventScroll: true })
    },
  })
}
