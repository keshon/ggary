import { createAnatomy, type Dict, type Normalizer } from '../../types'
import type { StatusTone } from '../../utils/tone'

/**
 * How far along something is: a bar, or a ring. A `progressbar` with its
 * value, range and a spoken text; with no value it is indeterminate — busy, the
 * amount unknown — and says nothing about how far.
 *
 * The drawn amount is one number, `--gg-progress` (0 to 1), set on the track:
 * the bar's range scales by it, the ring's arc sweeps it. Data, not a look, as
 * the slider's fill is.
 */

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

export const progressAnatomy = createAnatomy('progress', ['root', 'header', 'label', 'value-text', 'track', 'range'] as const)
export type ProgressPart = (typeof progressAnatomy.parts)[number]

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export function progressFraction(value: number | null | undefined, min = 0, max = 100): number | null {
  if (value === null || value === undefined || !Number.isFinite(value) || max <= min) return null
  return (clamp(value, min, max) - min) / (max - min)
}

export function connect<T = Dict>(props: ProgressProps & { id: string }, normalize: Normalizer<T>) {
  const { id, value, min = 0, max = 100, label, shape = 'bar', size = 'md', tone = 'running', locale } = props
  const fraction = progressFraction(value, min, max)
  const indeterminate = fraction === null
  const now = indeterminate ? null : clamp(value!, min, max)
  const text = indeterminate
    ? null
    : typeof props.valueText === 'function'
      ? props.valueText(now!, fraction)
      : props.valueText ?? new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(fraction)
  const ids = { root: id, label: `${id}-label` }
  const state = indeterminate ? 'indeterminate' : fraction === 1 ? 'complete' : 'loading'

  return {
    ids,
    fraction,
    indeterminate,
    valueText: text,
    rootProps: normalize({
      ...progressAnatomy.attrs('root'),
      id: ids.root,
      'data-shape': shape,
      'data-size': size,
      'data-tone': tone,
      'data-state': state,
    }),
    /** Over a bar: the label and the value text on one line. */
    headerProps: normalize({ ...progressAnatomy.attrs('header') }),
    labelProps: normalize({ ...progressAnatomy.attrs('label'), id: ids.label }),
    // Shown for the eye; the track says the same to a reader, so this is not read twice.
    valueTextProps: normalize({ ...progressAnatomy.attrs('value-text'), 'aria-hidden': 'true' }),
    trackProps: normalize({
      ...progressAnatomy.attrs('track'),
      role: 'progressbar',
      'aria-labelledby': label && !props.hideLabel ? ids.label : undefined,
      'aria-label': label && props.hideLabel ? label : undefined,
      'aria-valuemin': min,
      'aria-valuemax': max,
      'aria-valuenow': now ?? undefined,
      'aria-valuetext': text ?? undefined,
      'data-state': state,
      style: { '--gg-progress': fraction ?? undefined },
    }),
    rangeProps: normalize({ ...progressAnatomy.attrs('range'), 'data-state': state }),
  }
}

export type ProgressApi<T = Dict> = ReturnType<typeof connect<T>>
