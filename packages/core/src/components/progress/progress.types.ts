import type { StatusTone } from '../../utils/tone'

export type ProgressShape = 'bar' | 'ring'
export type ProgressSize = 'sm' | 'md' | 'lg'
/** The tones a job can end in: `ok` done, `warn` stalled, `error` failed. `running` is the default. */
export type ProgressTone = Extract<StatusTone, 'running' | 'ok' | 'warn' | 'error'>

export interface ProgressProps {
  /** How far along, between `min` and `max`. `null` or absent: indeterminate. */
  value?: number | null
  min?: number
  max?: number
  /** What is progressing: shown above a bar, and the element's name. */
  label?: string
  /** Name the progress with `label` without drawing it: a ring in a button, a bar in a table row. */
  hideLabel?: boolean
  /** The value in words: shown, and spoken. Default: a percentage in the locale's form. */
  valueText?: string | ((value: number, fraction: number) => string)
  shape?: ProgressShape
  size?: ProgressSize
  tone?: ProgressTone
  /** For the default percentage. Default: the page's. */
  locale?: string
}
