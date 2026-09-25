import { ChoiceCardGroup, Fieldset } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { runExtras, runModes, runModesWithLocked } from './data'

export default function ChoiceCardGroupPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label={`type="radio"`} wide>
            <ChoiceCardGroup type="radio" label="Run mode" items={runModes} defaultValue="parallel" />
          </Specimen>
          <Specimen label={`type="checkbox"`} wide>
            <ChoiceCardGroup type="checkbox" label="Also" items={runExtras} defaultValue={['trace']} />
          </Specimen>
          <Specimen label={`type="checkbox" orientation="horizontal"`} wide>
            <ChoiceCardGroup type="checkbox" orientation="horizontal" label="Also" items={runExtras} defaultValue={['notify']} />
          </Specimen>
        </>
      }
      states={
        <>
          <Specimen label="no value" wide>
            <ChoiceCardGroup label="Run mode" items={runModes} />
          </Specimen>
          <Specimen label="items[].disabled" wide>
            <ChoiceCardGroup label="Run mode" items={runModesWithLocked} defaultValue="sequential" />
          </Specimen>
          <Specimen label="disabled" wide>
            <ChoiceCardGroup label="Run mode" disabled items={runModes} defaultValue="parallel" />
          </Specimen>
          <Specimen label="invalid" wide>
            <ChoiceCardGroup label="Run mode" invalid items={runModes} />
          </Specimen>
          <Specimen label="required" wide>
            <ChoiceCardGroup label="Run mode" required items={runModes} />
          </Specimen>
        </>
      }
      composition={
        <Specimen label="in a Fieldset, invalid error" wide>
          <Fieldset legend="Run mode" hint="How the queue is worked through" error="Choose how to run the queue" invalid required>
            <ChoiceCardGroup items={runModes} />
          </Fieldset>
        </Specimen>
      }
    />
  )
}
