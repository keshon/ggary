import { Fieldset, RadioGroup } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { billing, plans, plansWithLocked } from './data'

export default function RadioGroupPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label={`orientation="vertical"`}>
            <RadioGroup label="Plan" orientation="vertical" items={plans} defaultValue="pro" />
          </Specimen>
          <Specimen label={`orientation="horizontal"`}>
            <RadioGroup label="Billing" orientation="horizontal" items={billing} defaultValue="monthly" />
          </Specimen>
        </>
      }
      states={
        <>
          <Specimen label="no value">
            <RadioGroup label="Plan" items={plans} />
          </Specimen>
          <Specimen label="items[].disabled">
            <RadioGroup label="Plan" items={plansWithLocked} defaultValue="free" />
          </Specimen>
          <Specimen label="disabled">
            <RadioGroup label="Plan" disabled items={plans} defaultValue="pro" />
          </Specimen>
          <Specimen label="invalid">
            <RadioGroup label="Plan" invalid items={plans} />
          </Specimen>
          <Specimen label="required">
            <RadioGroup label="Plan" required items={plans} />
          </Specimen>
        </>
      }
      composition={
        <Specimen label="in a Fieldset, invalid error">
          <Fieldset legend="Plan" hint="You can change it later" error="Choose a plan" invalid required>
            <RadioGroup items={plans} />
          </Fieldset>
        </Specimen>
      }
    />
  )
}
