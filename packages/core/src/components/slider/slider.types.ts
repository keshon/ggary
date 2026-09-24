import type { ControlSize } from '../../utils/size'
export type SliderSize = ControlSize

/** A labelled tick under the track: a value, or a value with its own words. Labels only — the step still decides where a thumb stops. */
export type SliderMark = number | { value: number; label?: string }

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
  /** Labelled ticks under the track. A bare number is labelled with the formatted value. */
  marks?: SliderMark[]
  size?: SliderSize
  disabled?: boolean
  required?: boolean
  invalid?: boolean
}
