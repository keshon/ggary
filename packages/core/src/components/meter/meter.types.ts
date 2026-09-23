import type { ReadingInput } from '../../utils/reading'
import type { StatusTone } from '../../utils/tone'

/** The thickness of the track. The theme says what each one is worth. */
export type MeterSize = 'sm' | 'md' | 'lg'

export interface MeterProps extends ReadingInput {
  /** What is being measured: shown above the bar, and the bar's name. */
  label?: string
  /** Name the meter with `label` without drawing it: a meter in a table row, in a card already titled. */
  hideLabel?: boolean
  /** Show the reading in words beside the label. Default: shown — a length and a colour are not a number. */
  showValue?: boolean
  /**
   * What the quantity MEANS, when it has come to mean something: a threshold
   * crossed, a limit spent. One tone for one quantity, never a series colour.
   * Without one, the accent, which is the right answer nearly always.
   */
  tone?: StatusTone
  size?: MeterSize
}
