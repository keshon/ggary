import { CheckboxGroup, Fieldset } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { notifyItems } from '../../data/inputs-basic'
import { withLocked } from './data'

const ORIENTATIONS = ['vertical', 'horizontal'] as const

export default function CheckboxGroupPage() {
  return (
    <DemoPage
      variants={ORIENTATIONS.map((orientation) => (
        <Specimen key={orientation} label={`orientation="${orientation}"`} wide={orientation === 'horizontal'}>
          <CheckboxGroup label="Notifications" orientation={orientation} items={notifyItems} defaultValue={['mentions', 'replies']} />
        </Specimen>
      ))}
      states={
        <>
          <Specimen label="items[].disabled">
            <CheckboxGroup label="Notifications" items={withLocked} defaultValue={['mentions', 'security']} />
          </Specimen>
          <Specimen label="disabled">
            <CheckboxGroup label="Notifications" disabled items={notifyItems} defaultValue={['mentions']} />
          </Specimen>
          <Specimen label="invalid">
            <CheckboxGroup label="Notifications" invalid items={notifyItems} />
          </Specimen>
          <Specimen label="required">
            <CheckboxGroup label="Notifications" required items={notifyItems} />
          </Specimen>
        </>
      }
      composition={
        <Specimen label="in a Fieldset, invalid error">
          <Fieldset legend="Notifications" hint="Pick at least one" error="Pick at least one kind" invalid required>
            <CheckboxGroup items={notifyItems} />
          </Fieldset>
        </Specimen>
      }
    />
  )
}
