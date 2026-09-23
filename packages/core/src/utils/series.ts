/**
 * The kit's one vocabulary of categorical colour: six series, and no seventh.
 *
 * A series is a CATEGORY — which of several — and never a state. The status
 * tones say whether something is going well; a series says nothing of the
 * kind, so `StatusTone` has no business on a chart's marks and a series
 * colour has none on text: 3:1 is a mark's threshold, not a word's.
 *
 * The number is part of the contract rather than a sort order: series 1 is
 * `--gg-chart-1` in the legend and on the chart alike, whatever either is
 * sorted by. Past six, colour stops telling things apart and the marks need
 * labels on them instead.
 *
 * With no series at all the component takes the accent, because one series is
 * not a category: there is nothing to tell apart, and the first hue of the
 * palette would name a category that does not exist.
 */
export type ChartSeries = 1 | 2 | 3 | 4 | 5 | 6

/** How many the palette holds. A number past it is not drawn as a series. */
export const CHART_SERIES_COUNT = 6

/** The attribute the theme maps to a hue, absent when there is no series to name. */
export const seriesAttr = (series: ChartSeries | undefined): string | undefined =>
  series !== undefined && Number.isInteger(series) && series >= 1 && series <= CHART_SERIES_COUNT ? String(series) : undefined
