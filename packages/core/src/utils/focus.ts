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

/**
 * Focus what a menu's state names — a row of the menu or of a submenu, or the
 * menu itself — and keep it inside its scroll viewport. Silent when the target
 * is not rendered yet: the adapter calls it again once a submenu is shown.
 */
export function focusMenuTarget(doc: Document, target: { contentId: string; itemId: string | null } | null): void {
  const content = target && doc.getElementById(target.contentId)
  if (content) focusMenuItem(content, target.itemId)
}

/** Scroll the target row into view without moving focus. For after placement, which shortens the list. */
export function revealMenuTarget(doc: Document, target: { contentId: string; itemId: string | null } | null): void {
  if (!target?.itemId) return
  scrollIntoViewIfNeeded(doc.getElementById(target.itemId), doc.getElementById(target.contentId))
}

/**
 * Move focus to a tab and keep it inside its tab list's scroll strip. A long
 * row of open documents scrolls; focusing without scrolling would leave the
 * focused tab out of sight, and letting focus scroll would move the page.
 */
export function focusTab(document: Document, id: string): void {
  rovingFocus(document, id)
  const tab = document.getElementById(id)
  const list = tab?.parentElement
  if (!tab || !list) return
  const start = tab.offsetLeft - list.offsetLeft
  const end = start + tab.offsetWidth
  if (start < list.scrollLeft) list.scrollLeft = start
  else if (end > list.scrollLeft + list.clientWidth) list.scrollLeft = end - list.clientWidth
}
