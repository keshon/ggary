import { useState } from 'react'
import { Button, Cluster, Field, Fieldset, Form, FormSummary, Stack, ConfigProvider, DatePicker } from '@ggary/react'
import { rangePresets } from '@ggary/core/date-picker'
import { DemoPage, Specimen } from '../../react/DemoPage'

function DateForm() {
  const [saved, setSaved] = useState('')
  return <Form onReset={() => setSaved('')} onSubmit={data => {
    if (data.get('due') === '2026-10-14') return { errors: { due: 'This date is fully booked. Choose another day.' } }
    setSaved(`Saved date: ${data.get('due')}; period: ${data.get('period')}.`)
  }}><Stack>
    <FormSummary />
    <Field name="due" label="Due date" required hint="14 October demonstrates a server error. Typed dates commit on blur or Enter.">
      <DatePicker locale="en-GB" min="2026-10-01" max="2026-12-31" />
    </Field>
    <Field name="period" label="Date range" required><DatePicker mode="range" locale="en-GB" /></Field>
    <Field name="fixed" label="Read-only date" readOnly><DatePicker defaultValue="2026-10-14" locale="en-GB" /></Field>
    <Fieldset disabled legend="Disabled section"><DatePicker name="archived" label="Archived date" defaultValue="2026-10-14" /></Fieldset>
    <Cluster><Button type="submit" emphasis="high">Save dates</Button><Button type="reset">Reset dates</Button></Cluster>
    <p role="status">{saved || 'No dates saved yet.'}</p>
  </Stack></Form>
}

const SIZES = ['sm', 'md', 'lg'] as const

export default function DatePickerPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label={`mode="single"`}>
            <DatePicker label="Follow up on" locale="en-GB" mode="single" defaultValue="2026-10-14" />
          </Specimen>
          <Specimen label={`mode="range"`} wide>
            <DatePicker label="Registered between" locale="en-GB" mode="range" defaultValue={{ start: '2026-10-12', end: '2026-10-16' }} />
          </Specimen>
          <Specimen label={`mode="range" months={2}`} wide>
            <DatePicker label="Stay" locale="en-GB" mode="range" months={2} defaultValue={{ start: '2026-10-26', end: '2026-11-06' }} />
          </Specimen>
          <Specimen label="time" wide>
            <DatePicker label="Meeting starts" locale="en-GB" time defaultValue="2026-10-14T15:30" />
          </Specimen>
        </>
      }
      sizes={SIZES.map((size) => (
        <Specimen key={size} label={`size="${size}"`}>
          <DatePicker size={size} label="Close by" locale="en-GB" defaultValue="2026-11-30" />
        </Specimen>
      ))}
      states={
        <Specimen label="empty">
          <DatePicker label="Follow up on" locale="en-GB" />
        </Specimen>
      }
      composition={
        <>
          <Specimen label="Field · required, ranges, server errors and reset" wide><DateForm /></Specimen>
          <Specimen label={`mode="range" presets={rangePresets()}`} wide>
            <DatePicker label="Registered between" locale="en-GB" mode="range" presets={rangePresets()} />
          </Specimen>
          <Specimen label='Base UI · local dark, dir="rtl"'>
            <ConfigProvider mode="dark" dir="rtl">
              <DatePicker label="RTL date" locale="en-GB" defaultValue="2026-10-14" />
            </ConfigProvider>
          </Specimen>
        </>
      }
    />
  )
}
