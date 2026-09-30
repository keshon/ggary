/**
 * A long ribbon's scroll behaviour, attached once to its root.
 *
 * Two jobs the adapters should not each reinvent. First, the fades: where
 * content runs under the edge it hides in a gradient, and the gradient needs
 * the scroll position, which CSS cannot read — so each scroller reports back
 * with `data-fade-start` and `data-fade-end`, which the theme keys its masks
 * off, and says nothing while there is nowhere to go. Second, the wheel: a
 * vertical gesture over a scroller that can move sideways moves it sideways —
 * and only sideways. At the end of the room the gesture goes nowhere rather
 * than leaking into the page: no mixing, the way back is the other direction.
 * Where there is nowhere to go at all, the wheel is left alone and the page
 * keeps its scroll.
 */

const SCROLLER = '[data-part="tab-list"], [data-part="panel"]'
const OWNER = '[data-scope="ribbon"][data-part="root"]'
/** px of forgiveness at either end, against subpixel widths. */
const NEST = 2

function scrollersOf(root: HTMLElement): HTMLElement[] {
  return [...root.children].filter(
    (element): element is HTMLElement =>
      element instanceof HTMLElement && element.matches(SCROLLER) && !element.hasAttribute('hidden')
  )
}

function sync(scroller: HTMLElement): void {
  const max = scroller.scrollWidth - scroller.clientWidth
  if (max <= NEST) {
    scroller.removeAttribute('data-fade-start')
    scroller.removeAttribute('data-fade-end')
    return
  }
  scroller.toggleAttribute('data-fade-start', scroller.scrollLeft > NEST)
  scroller.toggleAttribute('data-fade-end', scroller.scrollLeft < max - NEST)
}

export function attachRibbonScrollers(root: HTMLElement): () => void {
  const syncAll = () => {
    for (const scroller of scrollersOf(root)) sync(scroller)
  }

  // `scroll` does not bubble, but capture hears it from every scroller below.
  const onScroll = (event: Event) => {
    const target = event.target
    if (target instanceof HTMLElement && scrollersOf(root).includes(target)) sync(target)
  }

  const onWheel = (event: WheelEvent) => {
    const target = event.target
    if (!(target instanceof Element)) return
    const scroller = target.closest(SCROLLER)
    if (!(scroller instanceof HTMLElement)) return
    // A nested ribbon's scroller belongs to it, not to this root.
    if (target.closest(OWNER) !== root) return
    // A diagonal gesture is already going sideways: leave it alone.
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
    const step = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY
    if (step === 0) return
    const max = scroller.scrollWidth - scroller.clientWidth
    // Nowhere to go at all: hand the gesture back to the page.
    if (max <= NEST) return
    // At the end of the room the gesture is swallowed, not mixed: scrolling
    // on is scrolling back. The assignment clamps by itself.
    event.preventDefault()
    scroller.scrollLeft += step
  }

  syncAll()
  root.addEventListener('scroll', onScroll, true)
  root.addEventListener('wheel', onWheel, { passive: false })
  // Tools come and go, and the room itself changes with the window.
  const resize = new ResizeObserver(syncAll)
  resize.observe(root)
  const mutate = new MutationObserver(syncAll)
  mutate.observe(root, { childList: true, subtree: true })

  return () => {
    root.removeEventListener('scroll', onScroll, true)
    root.removeEventListener('wheel', onWheel)
    resize.disconnect()
    mutate.disconnect()
  }
}
