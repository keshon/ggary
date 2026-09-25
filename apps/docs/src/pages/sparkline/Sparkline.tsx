import { Legend, Metric, Sparkline } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { runTimeTrend, shardTrend, suiteLegend, suiteSeries, warningTrend } from './data'

const SERIES = [1, 2, 3, 4, 5, 6] as const

export default function SparklinePage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="values">
            <Sparkline values={runTimeTrend} locale="en-GB" />
          </Specimen>
          <Specimen label="area">
            <Sparkline values={runTimeTrend} area locale="en-GB" />
          </Specimen>
          <Specimen label="last={false}">
            <Sparkline values={runTimeTrend} last={false} locale="en-GB" />
          </Specimen>
          {SERIES.map((series) => (
            <Specimen key={series} label={`series={${series}}`}>
              <Sparkline values={warningTrend} series={series} locale="en-GB" />
            </Specimen>
          ))}
        </>
      }
      states={
        <>
          <Specimen label="up · down · level">
            <Sparkline values={warningTrend} label="Warnings: 12, up from 4" />
            <Sparkline values={runTimeTrend} label="Run time: 42 s, down from 58 s" />
            <Sparkline values={shardTrend} label="Shards: 6, level" />
          </Specimen>
          <Specimen label="values={[42]}">
            <Sparkline values={[42]} locale="en-GB" />
          </Specimen>
        </>
      }
      composition={
        <>
          <Specimen label="describe={false}, beside a Metric">
            <Metric label="Run time" value={42} unit="s" delta="18% faster than the last" direction="down" tone="ok" locale="en-GB" />
            <Sparkline values={runTimeTrend} area describe={false} />
          </Specimen>
          <Specimen label="two series, keyed by a Legend">
            {suiteSeries.map((suite) => (
              <Sparkline key={suite.label} values={suite.values} series={suite.series} label={`${suite.label}: ${suite.value} on the last night`} />
            ))}
            <Legend items={suiteLegend} label="Time by suite" />
          </Specimen>
        </>
      }
    />
  )
}
