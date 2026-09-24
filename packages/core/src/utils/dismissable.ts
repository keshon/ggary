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

export interface DismissableOptions {
  onDismiss: (reason: DismissReason) => void
  /** Elements that count as inside — a trigger, whose own click toggles. */
  exclude?: (HTMLElement | null)[]
  /**
   * Whether a pointer press is outside. The default asks the DOM tree; a modal
   * <dialog> needs geometry instead, because a press on its ::backdrop is
   * targeted at the dialog element itself.
   */
  isOutside?: (event: PointerEvent) => boolean
  /** Escape dismisses this layer. Default true. Either way Escape stops here. */
  closeOnEscape?: boolean
  /** A press outside dismisses this layer. Default true. */
  closeOnOutside?: boolean
  /**
   * The layer does not own the pointer: presses are judged by the layer below,
   * as if it were not there. A tooltip is passive — it takes Escape, but a
   * press elsewhere while it shows must still close the popover under it.
   */
  passive?: boolean
}

interface Layer {
  node: HTMLElement
  options: DismissableOptions
}

/*
 * THE DISMISS STACK. Every open layer — a listbox, a popover, a dialog —
 * registers here, and only the topmost one hears Escape or an outside press.
 *
 * Without it every layer listens to the document on its own: Escape in a
 * select inside a dialog closes both, and a press on the select's option list
 * counts as "outside" for the dialog underneath. Nesting order is opening
 * order, which is what the user sees: what opened last is on top.
 *
 * One pair of listeners serves the whole stack, installed while it is not empty.
 */
const stack: Layer[] = []
let teardown: (() => void) | null = null

const top = () => stack[stack.length - 1]

function outside(layer: Layer, event: PointerEvent): boolean {
  const { node, options } = layer
  const target = event.target as Node | null
  if (!target) return false
  if (options.exclude?.some((el) => el?.contains(target))) return false
  if (options.isOutside) return options.isOutside(event)
  return !node.contains(target)
}

function listen(doc: Document): () => void {
  const onPointerDown = (event: PointerEvent) => {
    // Passive layers step aside; they are dismissed by their own triggers.
    const layer = [...stack].reverse().find((candidate) => !candidate.options.passive)
    if (!layer || layer.options.closeOnOutside === false) return
    if (outside(layer, event)) layer.options.onDismiss('outside-pointer')
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const layer = top()
    if (!layer || event.key !== 'Escape') return
    // Stop it for every layer below, and for the browser: a keydown whose
    // default is prevented makes no close request, so a native modal <dialog>
    // under a listbox does not close along with it. That holds even when this
    // layer ignores Escape — a persistent dialog must not be closed natively.
    event.preventDefault()
    event.stopPropagation()
    if (layer.options.closeOnEscape !== false) layer.options.onDismiss('escape')
  }

  // Capture phase: the stack decides before the page's own handlers see it.
  doc.addEventListener('pointerdown', onPointerDown, true)
  doc.addEventListener('keydown', onKeyDown, true)
  return () => {
    doc.removeEventListener('pointerdown', onPointerDown, true)
    doc.removeEventListener('keydown', onKeyDown, true)
  }
}

/**
 * Push `node` onto the dismiss stack. Returns the function that removes it —
 * from wherever it is, not only the top: an owner may close a lower layer
 * programmatically while one above it is still open.
 */
export function trackDismissable(node: HTMLElement, options: DismissableOptions): () => void {
  const layer: Layer = { node, options }
  stack.push(layer)
  if (!teardown) teardown = listen(node.ownerDocument)

  return () => {
    const index = stack.indexOf(layer)
    if (index !== -1) stack.splice(index, 1)
    if (stack.length === 0 && teardown) {
      teardown()
      teardown = null
    }
  }
}

/** How many layers are open. For tests and for debugging a stuck overlay. */
export const openLayerCount = () => stack.length

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

/** Stand the option in the middle of the scroll viewport: a list opening on its choice shows what lies either side of it. */
export function scrollIntoCenter(item: HTMLElement | null, container: HTMLElement | null): void {
  if (!item || !container) return
  container.scrollTop = Math.max(0, item.offsetTop - (container.clientHeight - item.offsetHeight) / 2)
}
