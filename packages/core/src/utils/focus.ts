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
