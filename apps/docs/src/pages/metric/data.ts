import type { MetricProps } from '@ggary/core/metric'

/** Each thing a metric can say, one at a time, with the props that say it. */
export const singles: { made: string; metric: MetricProps }[] = [
  { made: 'label · value', metric: { label: 'Leads this week', value: 1284 } },
  { made: 'unit', metric: { label: 'Run time', value: 42, unit: 's' } },
  { made: 'value="4:12" unit="min"', metric: { label: 'Duration p95', value: '4:12', unit: 'min' } },
  { made: 'delta', metric: { label: 'Duration p95', value: '4:12', unit: 'min', delta: 'median 2:48' } },
  { made: 'direction="down" tone="ok"', metric: { label: 'Run time', value: 42, unit: 's', delta: '18% faster than the last', direction: 'down', tone: 'ok' } },
  { made: 'tone="warn"', metric: { label: 'Tests passed', value: 248, unit: '/251', delta: '3 failing', tone: 'warn' } },
  { made: 'direction="up" tone="error"', metric: { label: 'Warnings', value: 12, delta: '5 new', direction: 'up', tone: 'error' } },
]

/** One nightly run, as a row of figures. */
export const runMetrics: MetricProps[] = [
  { label: 'Run time', value: 42, unit: 's', delta: '18% faster than the last', direction: 'down', tone: 'ok' },
  { label: 'Tests passed', value: 248, unit: '/251', delta: '3 failing', tone: 'warn' },
  { label: 'Warnings', value: 12, delta: '5 new', direction: 'up', tone: 'error' },
]

/** The state of a whole screen, for the band under its header. */
export const headlineMetrics: MetricProps[] = [
  { label: 'Success rate', value: '94.2', unit: '%', delta: '1.8 points down in a week', direction: 'down', tone: 'warn' },
  { label: 'Duration p95', value: '4:12', unit: 'min', delta: 'median 2:48' },
  { label: 'In the queue', value: 37, delta: '9 waiting over an hour', direction: 'up', tone: 'warn' },
]
