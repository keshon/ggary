import type { ControlSize } from '../../utils/size'
export type SliderSize = ControlSize

export interface SliderProps {
  id: string
  /** The id the input already has — server markup a custom element enhances. */
  inputId?: string
  value?: number
  /** 0 by default. */
  min?: number
  /** 100 by default. */
  max?: number
  /** 1 by default. */
  step?: number
  name?: string
  /** The accessible name when no Field labels the slider: a slider has no text of its own. */
  label?: string
  /**
   * What the value means, when the number alone does not say: "6 agents" rather
   * than "6". Announced instead of the number, and shown beside the thumb.
   */
  valueText?: string
  /** Show the value beside the track. */
  showValue?: boolean
  size?: SliderSize
  disabled?: boolean
  required?: boolean
  invalid?: boolean
}
