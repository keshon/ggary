import type { InputSize } from '../input'

export interface SearchProps {
  size?: InputSize
  name?: string
  placeholder?: string
  /** The accessible name when no Field labels it: a placeholder is not a label. */
  label?: string
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  invalid?: boolean
}
