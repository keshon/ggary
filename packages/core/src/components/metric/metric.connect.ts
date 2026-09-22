import type { IconName } from '@ggary/icons'
import type { Dict, Normalizer } from '../../types'
import { metricAnatomy, metricRowAnatomy } from './metric.anatomy'
import type { MetricProps, MetricRowProps } from './metric.types'

const ARROWS = { up: 'arrow-up', down: 'arrow-down' } as const satisfies Record<string, IconName>

/** A number in the locale's form; a string as given, since "4:12" is already written. */
export function metricValueText(value: string | number, locale?: string): string {
  return typeof value === 'number' ? new Intl.NumberFormat(locale).format(value) : value
}

/**
 * One number people watch: the label, the value with its unit, and the change.
 * No machine and no role: it is read in the order it is written — label,
 * number, change — which is the sentence. Not interactive; a metric that
 * opens something belongs inside a link or button whose name says both the
 * label and the number.
 *
 * Direction and judgement are two attributes on the delta, `data-dir` and
 * `data-tone`, because they are two facts: an arrow named after a judgement is
 * a mistake waiting to be applied.
 */
export function connect<T = Dict>(props: MetricProps, normalize: Normalizer<T>) {
  const { value, unit, delta, direction, tone, locale } = props
  const showDelta = delta !== undefined && delta !== ''
  return {
    valueText: metricValueText(value, locale),
    showUnit: unit !== undefined && unit !== '',
    showDelta,
    showDeltaIcon: showDelta && direction !== undefined,
    rootProps: normalize({ ...metricAnatomy.attrs('root') }),
    labelProps: normalize({ ...metricAnatomy.attrs('label') }),
    valueProps: normalize({ ...metricAnatomy.attrs('value') }),
    unitProps: normalize({ ...metricAnatomy.attrs('unit') }),
    deltaProps: normalize({ ...metricAnatomy.attrs('delta'), 'data-dir': direction, 'data-tone': tone }),
    // The words already say which way; the arrow says it again for the eye.
    deltaIconProps: normalize({
      ...metricAnatomy.attrs('delta-icon'),
      'data-icon': direction ? ARROWS[direction] : undefined,
      'aria-hidden': 'true',
    }),
  }
}

/** A row of metrics: tiles on a quiet surface, or one surface parted by hairlines. */
export function connectRow<T = Dict>(props: MetricRowProps, normalize: Normalizer<T>) {
  const { joined = false, headline = false } = props
  return {
    rootProps: normalize({
      ...metricRowAnatomy.attrs('root'),
      'data-joined': joined ? '' : undefined,
      'data-headline': headline ? '' : undefined,
    }),
  }
}
