/**
 * Where the bar of controls stands INSIDE the frame.
 *
 * `edge`: the trailing slot beside the field, sunk to its last line. Sending is
 * one control and does not deserve a row of its own, so an empty composer is
 * one line tall.
 *
 * `row`: the whole width under the field. The shape for a composer whose
 * controls are more than sending — an attachment, a model, a count of what is
 * left — and it costs the empty field its single line, which is the trade.
 */
export type ComposerBar = 'edge' | 'row'

export interface ComposerProps {
  /**
   * The field's name. Required: a placeholder is not a name — it goes as soon
   * as a character is typed, and the frame is a `<div>` that takes no focus, so
   * the name has to live on the field itself.
   */
  label: string
  placeholder?: string
  /** Default `edge`. */
  bar?: ComposerBar
  /**
   * The machine is working. Sending is not available — there is nothing to send
   * to — so the button becomes "stop" and Enter no longer sends. The field
   * stays editable: the next instruction can be written while this one runs.
   */
  busy?: boolean
  /** Nothing to send: an empty field, or an owner that has closed the thread. */
  disabled?: boolean
  /**
   * `Enter` sends and `Shift+Enter` breaks the line. Default true. Set it false
   * where the field is the subject of a long edit and a line break is the more
   * common intent; the send button is then the only way to send, and it must
   * therefore always be shown.
   */
  submitOnEnter?: boolean
  /** The field's floor in lines, and what it shrinks back to. Default 1. */
  rows?: number
  /** The cap on growth, in lines. Past it the field scrolls rather than eating the thread above. Default 8. */
  maxRows?: number
}

/** The fixed text of the composer's own control. */
export interface ComposerWords {
  /** The send button's name. Default "Send". */
  send?: string
  /** Its name while the machine is working. Default "Stop". */
  stop?: string
}
