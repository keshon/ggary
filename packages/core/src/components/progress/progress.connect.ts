import type { Dict, Normalizer } from '../../types'
import { progressAnatomy } from './progress.anatomy'
import type { ProgressProps } from './progress.types'

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
