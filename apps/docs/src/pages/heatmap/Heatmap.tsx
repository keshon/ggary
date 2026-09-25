import { Heatmap } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { runQuarter, runYear } from './data'

export default function HeatmapPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="weekStart={1}" wide>
            <Heatmap days={runYear} weekStart={1} unit="runs" label="Runs a day" locale="en-GB" />
          </Specimen>
          <Specimen label="weekStart={0}" wide>
            <Heatmap days={runYear} weekStart={0} unit="runs" label="Runs a day" locale="en-GB" />
          </Specimen>
          <Specimen label="13 weeks">
            <Heatmap days={runQuarter} unit="runs" label="Runs a day" locale="en-GB" />
          </Specimen>
        </>
      }
      states={
        <Specimen label="days={[]}">
          <Heatmap days={[]} unit="runs" label="Runs a day" locale="en-GB" />
        </Specimen>
      }
    />
  )
}
