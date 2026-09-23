import type { ChartSeries } from '../../utils/series'

/** Which way the series went, from its first value to its last. */
export type SparklineDirection = 'up' | 'down' | 'level'

export interface SparklineWords {
  /**
   * The name a sparkline gives itself when the author writes none: where the
   * series ended, and where it came from. "42, up from 31".
   */
  reading: (first: string, last: string, direction: SparklineDirection) => string
  /** Fewer than two values: there is no shape, and the name says so. */
  empty: string
}

export interface SparklineProps {
  /**
   * The series, in order. Fewer than two, or a value that is not a finite
   * number, draws nothing: a shape needs two points to be a shape.
   */
  values: number[]
  /** The fill under the line: one flat hue at low alpha, never a gradient. */
  area?: boolean
  /** A dot on the final value — where the series got to. Default: drawn. */
  last?: boolean
  /**
   * Which of the six categorical hues. Left out, the line takes the accent:
   * one series is not a category. A sparkline is single-series by definition,
   * so this is for a row of them that a legend keys.
   */
  series?: ChartSeries
  /**
   * The reading in words: "42 runs, up from 31". Default: the first and last
   * value in the locale's form, and which way it went.
   */
  label?: string
  /**
   * Whether the picture has a name of its own. Default: it does.
   *
   * Pass `false` where the same numbers stand beside it in text — a sparkline
   * under a Metric is the usual case — and the `<svg>` goes `aria-hidden`
   * instead. The default is the loud one on purpose: a name that repeats the
   * number next to it is noise a reader can hear and an author can switch
   * off, while a picture with no name at all is a loss nobody hears.
   */
  describe?: boolean
  /** For the numbers in the default name. Default: the page's. */
  locale?: string
}
