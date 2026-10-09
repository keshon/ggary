import { useState } from 'react'
import { Button, Cluster, DatePicker, Field, Form, FormSummary, Stack, ConfigProvider, TimePicker } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'

function TimeForm() {
  const [saved, setSaved] = useState('')
  return <Form onReset={() => setSaved('')} onSubmit={data => {
    if (data.get('call') === '14:30') return { errors: { call: 'This time is fully booked. Choose another time.' } }
    setSaved(`Saved time: ${data.get('call')}; appointment: ${data.get('appointment')}.`)
  }}><Stack>
    <FormSummary />
    <Field name="call" label="Call time" required hint="14:30 demonstrates a server error. Typed times commit on blur or Enter.">
      <TimePicker locale="en-GB" min="09:00" max="18:00" />
    </Field>
    <Field name="appointment" label="Appointment" required><DatePicker time locale="en-GB" /></Field>
    <Field name="fixed" label="Read-only time" readOnly><TimePicker defaultValue="14:30" locale="en-GB" /></Field>
    <Cluster><Button type="submit" emphasis="high">Save times</Button><Button type="reset">Reset times</Button></Cluster>
    <p role="status">{saved || 'No times saved yet.'}</p>
  </Stack></Form>
}

const SIZES = ['sm', 'md', 'lg'] as const

export default function TimePickerPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label={`locale="en-GB"`}>
            <TimePicker label="Call at" locale="en-GB" defaultValue="14:30" />
          </Specimen>
          <Specimen label={`locale="en-US"`}>
            <TimePicker label="Call at" locale="en-US" defaultValue="14:30" />
          </Specimen>
        </>
      }
      sizes={SIZES.map((size) => (
        <Specimen key={size} label={`size="${size}"`}>
          <TimePicker size={size} label="Starts" locale="en-GB" defaultValue="09:00" />
        </Specimen>
      ))}
      composition={
        <>
        <Specimen label="Field · time and DateTime constraints" wide><TimeForm /></Specimen>
        <Specimen label='Base UI · local dark, dir="rtl"'>
          <ConfigProvider mode="dark" dir="rtl">
            <TimePicker label="RTL time" locale="en-GB" defaultValue="14:30" />
          </ConfigProvider>
        </Specimen>
        </>
      }
      states={
        <Specimen label="empty">
          <TimePicker label="Call at" locale="en-GB" />
        </Specimen>
      }
    />
  )
}
