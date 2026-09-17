export interface FieldState {
  id: string
  required: boolean
  disabled: boolean
  readOnly: boolean
  /** Declared by the owner: server validation, a cross-field rule. */
  invalid: boolean
  /**
   * The user has left the control, or a form submission asked it to validate.
   * Native constraint errors are shown only from then on — the `:user-invalid`
   * rule: a form must not greet the user with errors they have not made yet.
   */
  touched: boolean
  /** The control's native constraint validity, as last reported. */
  valid: boolean
  /** The control's native validationMessage, as last reported. */
  message: string
}

export type FieldEvent =
  /** The full set of owner-declared state; an absent flag is false. */
  | { type: 'SYNC'; required?: boolean; disabled?: boolean; readOnly?: boolean; invalid?: boolean }
  /** The user left the control. */
  | { type: 'BLUR'; valid: boolean; message: string }
  /** The value changed. Revalidates only once the field has been touched. */
  | { type: 'INPUT'; valid: boolean; message: string }
  /** A form submission found the control invalid (the native `invalid` event). */
  | { type: 'INVALID'; message: string }
  /** Back to untouched, as after a form reset. */
  | { type: 'RESET' }
