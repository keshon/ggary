/** Keep the focus ring for keyboard use without letting Bits UI's programmatic pointer focus show it. */
export function markPointerFocus(event: PointerEvent) {
  ;(event.currentTarget as HTMLElement).dataset.pointerFocus = ''
}

export function markKeyboardFocus(event: KeyboardEvent) {
  delete (event.currentTarget as HTMLElement).dataset.pointerFocus
}

export function clearPointerFocus(event: FocusEvent) {
  const control = event.currentTarget as HTMLElement
  if (!control.contains(event.relatedTarget as Node | null)) delete control.dataset.pointerFocus
}
