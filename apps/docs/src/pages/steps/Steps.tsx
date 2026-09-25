import { Steps } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { imported, importing, notStarted, noted } from './data'

export default function StepsPage() {
  return (
    <DemoPage
      states={
        <>
          <Specimen label={`state="done" · "current" · "todo"`} wide>
            <Steps label="Import" items={importing} />
          </Specimen>
          <Specimen label={`state="current" · "todo"`} wide>
            <Steps label="Import" items={notStarted} />
          </Specimen>
          <Specimen label={`state="done"`} wide>
            <Steps label="Import" items={imported} />
          </Specimen>
        </>
      }
      composition={
        <Specimen label="note" wide>
          <Steps label="Import" items={noted} />
        </Specimen>
      }
    />
  )
}
