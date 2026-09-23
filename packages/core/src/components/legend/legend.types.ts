import type { ChartSeries } from '../../utils/series'

export interface LegendItem {
  /** What the series is, in words. Colour is never the only carrier. */
  label: string
  /**
   * Which of the six hues, matching the chart's. Left out, the swatch takes
   * the accent: one series is not a category. From two series up, every item
   * names its own — the first included.
   */
  series?: ChartSeries
  /**
   * The quantity, already written: "18.2 s", "41%". A second carrier, and
   * what gets scanned, so it is the item's loudest ink.
   */
  value?: string
}

/** Along the foot of a chart, or down its side where the chart is tall. */
export type LegendDirection = 'row' | 'column'

export interface LegendWords {
  /** What the list is called where the author names nothing. */
  key: string
}

export interface LegendProps {
  /**
   * The series, in the chart's own order. The number of a series is a
   * contract, not a sort order: a legend sorted by quantity beside a chart
   * sorted by time gives two numberings of one thing.
   */
  items: LegendItem[]
  /** Default: row, wrapping. */
  direction?: LegendDirection
  /** The name of the list: "Time by module". Default: "Chart key". */
  label?: string
}
