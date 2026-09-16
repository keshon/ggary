/**
 * DOM-aware but framework-free. This is the layer split that matters:
 *
 *   components/<name>/machine.ts   pure, Node-testable, never touches document
 *   utils/*.ts                     touches the DOM, but only inside functions
 *
 * "SSR-safe" does not mean "no DOM" — it means no DOM access at module scope.
 * Importing this file on a server is fine; calling it is not.
 */
export type DismissReason = 'outside-pointer' | 'escape'

export function trackDismissable(
  node: HTMLElement,
  options: { onDismiss: (reason: DismissReason) => void; exclude?: (HTMLElement | null)[] }
): () => void {
  const { onDismiss, exclude = [] } = options
  const doc = node.ownerDocument

  const onPointerDown = (event: PointerEvent) => {
    const target = event.target as Node | null
    if (!target) return
    if (node.contains(target)) return
    if (exclude.some((el) => el?.contains(target))) return
    onDismiss('outside-pointer')
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return
    event.stopPropagation()
    onDismiss('escape')
  }

  // Capture phase: dismiss before the page's own handlers see the event.
  doc.addEventListener('pointerdown', onPointerDown, true)
  doc.addEventListener('keydown', onKeyDown, true)
  return () => {
    doc.removeEventListener('pointerdown', onPointerDown, true)
    doc.removeEventListener('keydown', onKeyDown, true)
  }
}

/** Keep the highlighted option inside the scroll viewport, without smooth-scroll jank. */
export function scrollIntoViewIfNeeded(item: HTMLElement | null, container: HTMLElement | null): void {
  if (!item || !container) return
  const itemTop = item.offsetTop
  const itemBottom = itemTop + item.offsetHeight
  if (itemTop < container.scrollTop) container.scrollTop = itemTop
  else if (itemBottom > container.scrollTop + container.clientHeight) {
    container.scrollTop = itemBottom - container.clientHeight
  }
}
