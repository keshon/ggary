import { History, KeyValueList } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { runHistory } from '../../data/agent'
import { everyTick, runHistoryHours, workflows } from './data'

const SIZES = ['sm', 'md', 'lg'] as const

export default function HistoryPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="ticks">
            <History ticks={runHistory} locale="en-GB" />
          </Specimen>
          <Specimen label="groups" wide>
            <History groups={runHistoryHours} size="lg" label="Nightly audits by the hour" locale="en-GB" />
          </Specimen>
        </>
      }
      sizes={SIZES.map((size) => (
        <Specimen key={size} label={`size="${size}"`}>
          <History ticks={runHistory} size={size} locale="en-GB" />
        </Specimen>
      ))}
      states={
        <>
          <Specimen label={`tone="ok" · "warn" · "error" · empty · no tone · "running"`}>
            <History ticks={everyTick} size="lg" locale="en-GB" />
          </Specimen>
          <Specimen label="ticks={[]}">
            <History ticks={[]} size="lg" locale="en-GB" />
          </Specimen>
        </>
      }
      composition={
        <Specimen label="beside names, in a KeyValueList" wide>
          <KeyValueList items={workflows.map((workflow) => ({ label: workflow.label, value: <History ticks={workflow.ticks} label={workflow.label} locale="en-GB" /> }))} />
        </Specimen>
      }
    />
  )
}
