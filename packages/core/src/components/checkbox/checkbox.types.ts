/** `indeterminate` is shown, never chosen: a user's click always yields a boolean. */
export type CheckedState = boolean | 'indeterminate'

export interface CheckboxProps {
  checked?: CheckedState
  name?: string
  /** Submitted when checked. The browser's default is "on". */
  value?: string
  disabled?: boolean
  /** Not native for checkboxes: aria-readonly, and the click is blocked. */
  readOnly?: boolean
  required?: boolean
  invalid?: boolean
}
