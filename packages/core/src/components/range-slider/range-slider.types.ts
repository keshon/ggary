import type { ControlSize } from '../../utils/size'
import type { SliderMark } from '../slider/slider.types'

/** The two ends of a range, lower first. */
export type RangeValue = [number, number]

/**
 * Where the two values are shown. `header`: in words beside the label.
 * `bubbles`: over their thumbs. `inputs`: two number fields under the track,
 * which move the thumbs when typed in.
 */
export type RangeValueDisplay = 'header' | 'bubbles' | 'inputs'

export interface RangeSliderProps {
  id: string
  /** Controlled. Default: the whole track, `[min, max]`. */
  value?: RangeValue
  /** 0 by default. */
  min?: number
  /** 100 by default. */
  max?: number
  /** 1 by default. */
  step?: number
  /** The least the two ends stand apart. 0 by default: they can meet, never cross. */
  minGap?: number
  /** Submits both ends under one name, or each under its own: `['price_min', 'price_max']`. */
  name?: string | [string, string]
  /** The range's name, shown over it: the group's accessible name. */
  label: string
  /** Default `header`. */
  valueDisplay?: RangeValueDisplay
  /** Before the number in each of the `inputs` fields: "€". */
  prefix?: string
  /** After the number in each of the `inputs` fields: "min". */
  suffix?: string
  /** Labelled ticks under the track. */
  marks?: SliderMark[]
  size?: ControlSize
  disabled?: boolean
  invalid?: boolean
}

export interface RangeSliderWords {
  /** The lower thumb's and field's name. Default "Minimum". */
  start?: string
  /** The upper thumb's and field's name. Default "Maximum". */
  end?: string
  /** The range in words. Default "{start} – {end}". */
  between?: (start: string, end: string) => string
}
