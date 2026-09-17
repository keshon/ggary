import { scrollIntoViewIfNeeded } from './dismissable'

/**
 * Roving tabindex needs REAL focus to move, which means someone has to call
 * `.focus()`. Putting that here rather than in each adapter keeps the rule — and
 * the two ways it goes wrong — in one place.
 */
export function rovingFocus(document: Document, id: string): void {
  const target = document.getElementById(id)
  if (!target) return
  if (document.activeElement === target) return
  // preventScroll: arrowing through a long wrapped chip row should not yank the
  // page around on every step.
  target.focus({ preventScroll: true })
}

/**
 * Focus the highlighted item of a menu, or the menu itself when nothing is
 * highlighted, and keep the item inside the menu's scroll viewport.
 *
 * The menu must already be shown: an element in a closed popover is not
 * rendered and does not take focus. Adapters call this after `attachPopover`.
 */
export function focusMenuItem(content: HTMLElement, itemId: string | null): void {
  const doc = content.ownerDocument
  const item = itemId ? doc.getElementById(itemId) : null
  const target = item ?? content
  if (doc.activeElement !== target) target.focus({ preventScroll: true })
  if (item) scrollIntoViewIfNeeded(item, content)
}
