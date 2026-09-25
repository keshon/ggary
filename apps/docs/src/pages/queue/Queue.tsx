import { Badge, Panel, Queue } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { allTasks, lockedTasks, runTasks } from './data'

const done = allTasks.filter((task) => task.state === 'done').length

export default function QueuePage() {
  return (
    <DemoPage
      states={
        <>
          <Specimen label={`state="done" · "warn" · "running" · "queued" · "failed" · "skipped"`} wide>
            <Queue tasks={runTasks} label="The queue of agents" />
          </Specimen>
          <Specimen label="defaultValue" wide>
            <Queue tasks={runTasks} label="The queue of agents" defaultValue="coverage-hole" />
          </Specimen>
          <Specimen label="disabled" wide>
            <Queue tasks={lockedTasks} label="The queue of agents" />
          </Specimen>
        </>
      }
      composition={
        <Specimen label={`in a Panel body="list"`} wide>
          <Panel title="The queue of agents" body="list" actions={<Badge>{`${done} of ${allTasks.length}`}</Badge>}>
            <Queue tasks={allTasks} label="The queue of agents" defaultValue="probes-assert" />
          </Panel>
        </Specimen>
      }
    />
  )
}
