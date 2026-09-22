import type { StatusTone } from '../../utils/tone'

/** Which way the number moved. Not whether that is good: that is `tone`. */
export type MetricDirection = 'up' | 'down'

export interface MetricProps {
  /** Of what: "Runs per day". A number with no answer to that is not a metric. */
  label: string
  /** A number is written in the locale's form; a string is shown as given ("4:12"). */
  value: string | number
  /** Set inside the value, smaller and quieter: "s", "%", "/251". */
  unit?: string
  /**
   * The change, in words that carry its sign themselves: "18% down on last
   * week", "5 new". The arrow repeats the direction; it is never the only
   * carrier of it.
   */
  delta?: string
  /** Which way it changed: draws an arrow before the delta. */
  direction?: MetricDirection
  /**
   * Whether the change is good or bad, from the kit's vocabulary. Independent
   * of `direction`: time going down is `ok`, warnings going up are `error`.
   * Without one the delta is in the neutral colour.
   */
  tone?: StatusTone
  /** For a numeric value. Default: the page's. */
  locale?: string
}

export interface MetricRowProps {
  /**
   * One surface parted by hairlines rather than a tile per metric: the band is
   * one fact, "the state of this screen", not a set of numbers.
   */
  joined?: boolean
  /**
   * The band directly under a page header: the values take the ceiling of the
   * type scale. One per screen, and never inside a region.
   */
  headline?: boolean
}
