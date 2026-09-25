import { Metric, MetricRow } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { headlineMetrics, runMetrics, singles } from './data'

const ROWS = [
  { label: 'MetricRow', joined: false, headline: false, metrics: runMetrics },
  { label: 'MetricRow joined', joined: true, headline: false, metrics: runMetrics },
  { label: 'MetricRow joined headline', joined: true, headline: true, metrics: headlineMetrics },
]

export default function MetricPage() {
  return (
    <DemoPage
      variants={singles.map(({ made, metric }) => (
        <Specimen key={made} label={made}>
          <Metric {...metric} locale="en-GB" />
        </Specimen>
      ))}
      composition={ROWS.map(({ label, joined, headline, metrics }) => (
        <Specimen key={label} label={label} wide>
          <MetricRow joined={joined} headline={headline}>
            {metrics.map((metric) => (
              <Metric key={metric.label} {...metric} locale="en-GB" />
            ))}
          </MetricRow>
        </Specimen>
      ))}
    />
  )
}
