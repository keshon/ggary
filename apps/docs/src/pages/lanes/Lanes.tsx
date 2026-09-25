import { Lanes } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { idleLanes, runLanes } from './data'

export default function LanesPage() {
  return (
    <DemoPage
      states={
        <>
          <Specimen label={`tone="ok" · "warn" · "error" · "neutral" · "running"`} wide>
            <Lanes label="The shards of run 4127" lanes={runLanes} locale="en-GB" />
          </Specimen>
          <Specimen label="spans={[]}" wide>
            <Lanes label="The agents of run 4128" lanes={idleLanes} locale="en-GB" />
          </Specimen>
          <Specimen label="start={40000} end={80000}" wide>
            <Lanes label="The shards of run 4127, 40 s to 80 s" lanes={runLanes} start={40_000} end={80_000} locale="en-GB" />
          </Specimen>
        </>
      }
    />
  )
}
