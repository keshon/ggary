import type { ControlSize } from '../../utils/size'
export type NumberFieldSize = ControlSize

export interface NumberFieldProps {
  id: string
  /** The id the input already has — server markup a custom element enhances. */
  inputId?: string
  min?: number
  max?: number
  /** The keyboard's step and the drag's. 1 by default. */
  step?: number
  name?: string
  /**
   * The accessible name when no Field labels it. It must name the property AND
   * the axis — "Position X", not "X": the letter is not a label.
   */
  label?: string
  /**
   * The letter drawn before the number, and a drag handle: drag it sideways to
   * change the value, Shift ×10, Alt ×0.1. Decoration to assistive technology.
   */
  axis?: string
  placeholder?: string
  size?: NumberFieldSize
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  invalid?: boolean
}
