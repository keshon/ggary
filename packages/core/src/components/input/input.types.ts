export type InputSize = 'sm' | 'md' | 'lg'

/** The text-like native input types. Checkboxes and radios are their own components. */
export type InputType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'number' | 'date' | 'time'

export interface InputProps {
  type?: InputType
  size?: InputSize
  name?: string
  placeholder?: string
  autoComplete?: string
  inputMode?: string
  disabled?: boolean
  /**
   * Readonly is not disabled: the value can still be read, selected, copied and
   * submitted. Themes must draw the two differently, or a user cannot tell
   * "wait for it to unlock" from "this never changes".
   */
  readOnly?: boolean
  required?: boolean
  invalid?: boolean
}
