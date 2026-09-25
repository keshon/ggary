/** Eleven nights of run time: the sparkline beside the metric that reports the last of them. */
export const runTimeTrend = [58, 61, 54, 57, 49, 52, 47, 50, 45, 44, 42]

/** The same run's warnings, climbing; and its shards, level. */
export const warningTrend = [4, 5, 5, 6, 5, 7, 8, 8, 9, 11, 12]
export const shardTrend = [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6]

/** Two suites over the same eleven nights. Two series, so each names its hue — and a legend names them in words. */
export const suiteSeries = [
  { label: 'Unit tests', series: 1 as const, value: '18.2 s', values: [24.6, 23.9, 25.1, 22.4, 23.0, 21.2, 21.8, 19.9, 20.4, 18.8, 18.2] },
  { label: 'Browser tests', series: 2 as const, value: '11.5 s', values: [12.4, 13.1, 12.0, 12.8, 11.9, 12.6, 11.4, 12.2, 11.1, 11.8, 11.5] },
]

/** The key, in the chart's own order: the number of a series is a contract, not a sort order. */
export const suiteLegend = suiteSeries.map(({ label, series, value }) => ({ label, series, value }))
