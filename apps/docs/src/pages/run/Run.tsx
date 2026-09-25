import { Badge, History, KeyValueList, Panel, Run, Stack } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { runHistory } from '../../data/agent'
import { allDone, everyTone, notBegun, runCounters, runPhases } from './data'

export default function RunPage() {
  return (
    <DemoPage
      states={
        <>
          <Specimen label={`tone="ok" · "warn" · "error" · "neutral" · "running" · none`}>
            <Run units={everyTone} locale="en-GB" />
          </Specimen>
          <Specimen label="no tone">
            <Run units={notBegun} locale="en-GB" />
          </Specimen>
          <Specimen label={`tone="ok"`}>
            <Run units={allDone} locale="en-GB" />
          </Specimen>
          <Specimen label="showValue={false}">
            <Run units={everyTone} showValue={false} locale="en-GB" />
          </Specimen>
        </>
      }
      composition={
        <>
          <Specimen label="phases, in a Panel" wide>
            <Panel
              title="audit-worldbox-1"
              actions={
                <>
                  <History ticks={runHistory} size="sm" label="Nightly audits" locale="en-GB" />
                  <Badge tone="running">running</Badge>
                </>
              }
            >
              <Stack>
                <KeyValueList items={runCounters} tight />
                <KeyValueList
                  items={runPhases.map((phase) => ({
                    label: phase.label,
                    value: <Run units={phase.units} label={`${phase.label}: agents finished`} locale="en-GB" />,
                  }))}
                  tight
                />
              </Stack>
            </Panel>
          </Specimen>
        </>
      }
    />
  )
}
