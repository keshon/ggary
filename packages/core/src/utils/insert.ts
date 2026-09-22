/**
 * Putting text into a field the way typing would, so a framework's controlled
 * field sees the change.
 */

export type TextField = HTMLInputElement | HTMLTextAreaElement

/**
 * Write a field's value through its prototype's setter, not the element's own
 * property. React tracks the last value it rendered on the instance, and a
 * plain `field.value = x` updates that tracker too — React would then see no
 * change in the `input` event and never call onChange. Sets only; the caller
 * sends the event once the caret is placed.
 */
export function setFieldValue(field: TextField, value: string): void {
  const view = field.ownerDocument.defaultView
  const prototype =
    view && field instanceof view.HTMLTextAreaElement ? view.HTMLTextAreaElement.prototype : view?.HTMLInputElement.prototype
  const setter = prototype && Object.getOwnPropertyDescriptor(prototype, 'value')?.set
  if (setter) setter.call(field, value)
  else field.value = value
}

/**
 * The caret, or the selection. Types without one — email, number — answer
 * null, and the end is where the text goes then.
 */
function selectionOf(field: TextField): [number, number] {
  const end = field.value.length
  try {
    return [field.selectionStart ?? end, field.selectionEnd ?? end]
  } catch {
    return [end, end]
  }
}

/**
 * Insert at the caret rather than at the end — a person puts the cursor where
 * the text is wanted and expects it there — replacing a selection. The caret
 * lands after the insert, focus returns to the field, and a native `input`
 * follows: React, Svelte's bind and a plain listener all see the change with
 * no glue.
 */
export function insertAtCaret(field: TextField, text: string): void {
  const [start, end] = selectionOf(field)
  setFieldValue(field, field.value.slice(0, start) + text + field.value.slice(end))
  field.focus({ preventScroll: true })
  const caret = start + text.length
  try {
    field.setSelectionRange(caret, caret)
  } catch {
    // A type with no selection: the value is in, the caret is the browser's.
  }
  field.dispatchEvent(new Event('input', { bubbles: true }))
}
