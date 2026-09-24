import type { SVGAttributes } from 'react'
import { connect, type SparklineProps as CoreSparklineProps, type SparklineWords } from '@ggary/core/sparkline'
import { reactNormalizer } from '@ggary/core'

export interface SparklineProps extends CoreSparklineProps, Omit<SVGAttributes<SVGSVGElement>, 'values'> {
  /** The default reading in another language. */
  words?: Partial<SparklineWords>
}

/**
 * The shape of a change beside a number. The geometry is core's; this draws
 * it in the order it must be drawn — the fill, the line over it, the dot of
 * the last value last — and nothing else.
 */
export function Sparkline({ values, area, last, series, label, describe, locale, words, ...rest }: SparklineProps) {
  const api = connect({ values, area, last, series, label, describe, locale }, reactNormalizer, { words })
  return (
    <svg {...api.rootProps} {...rest}>
      {api.showArea && <path {...api.areaProps} />}
      {!api.empty && <path {...api.lineProps} />}
      {api.showLast && <circle {...api.lastProps} />}
    </svg>
  )
}
