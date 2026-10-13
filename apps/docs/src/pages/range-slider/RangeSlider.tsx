import { useState } from 'react'
import { Button, Cluster, Field, Fieldset, Form, FormSummary, Stack, RangeSlider } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { euro, minutes } from './data'

function RangeForm() {
  const [saved, setSaved] = useState('')
  return <Form onReset={() => setSaved('')} onSubmit={data => {
    const range = data.getAll('budget')
    if (range[1] === '80') return { errors: { budget: 'An upper limit of 80 demonstrates a server error. Change either endpoint.' } }
    setSaved(`Saved budget: ${range.join('–')}; fixed: ${data.getAll('fixed').join('–')}; archived: ${data.has('archived') ? 'yes' : 'no'}.`)
  }}><Stack>
    <FormSummary />
    <Field name="budget" label="Budget" hint="Type an endpoint, then press Enter or leave the editor to commit."><RangeSlider defaultValue={[20, 80]} valueDisplay="inputs" minGap={5} /></Field>
    <Field name="fixed" label="Read-only range" readOnly><RangeSlider defaultValue={[10, 50]} valueDisplay="inputs" /></Field>
    <Fieldset disabled legend="Disabled section"><RangeSlider label="Archived range" name="archived" defaultValue={[30, 60]} valueDisplay="inputs" /></Fieldset>
    <Cluster><Button type="submit" emphasis="high">Save ranges</Button><Button type="reset">Reset ranges</Button></Cluster>
    <p role="status">{saved || 'No ranges saved yet.'}</p>
  </Stack></Form>
}

const SIZES = ['sm', 'md', 'lg'] as const
const DISPLAYS = ['header', 'bubbles', 'inputs'] as const

export default function RangeSliderPage() {
  return (
    <DemoPage
      variants={DISPLAYS.map((valueDisplay) => (
        <Specimen key={valueDisplay} label={`valueDisplay="${valueDisplay}"`} wide>
          <RangeSlider label="Price" valueDisplay={valueDisplay} prefix="€" min={0} max={200} defaultValue={[40, 120]} formatValue={euro} />
        </Specimen>
      ))}
      sizes={SIZES.map((size) => (
        <Specimen key={size} label={`size="${size}"`} wide>
          <RangeSlider size={size} label="Price" min={0} max={200} defaultValue={[40, 120]} formatValue={euro} />
        </Specimen>
      ))}
      states={
        <>
          <Specimen label={`valueDisplay="bubbles" defaultValue={[60, 75]}`} wide>
            <RangeSlider label="Budget" valueDisplay="bubbles" min={0} max={200} defaultValue={[60, 75]} formatValue={euro} />
          </Specimen>
          <Specimen label="disabled" wide>
            <RangeSlider label="Retries" min={0} max={10} defaultValue={[1, 3]} marks={[0, 5, 10]} disabled />
          </Specimen>
          <Specimen label="invalid" wide>
            <RangeSlider label="Price" min={0} max={200} defaultValue={[0, 200]} formatValue={euro} invalid />
          </Specimen>
        </>
      }
      composition={
        <>
          <Specimen label="Field · two endpoints, server errors, read-only and reset" wide><RangeForm /></Specimen>
          <Specimen label="marks" wide>
            <RangeSlider label="Run time" min={0} max={60} defaultValue={[2, 45]} formatValue={minutes} marks={[0, 15, 30, 45, 60]} />
          </Specimen>
          <Specimen label={`valueDisplay="inputs" suffix="min" minGap={5}`} wide>
            <RangeSlider label="Run time" valueDisplay="inputs" suffix="min" min={0} max={60} minGap={5} defaultValue={[10, 30]} formatValue={minutes} name={['time_min', 'time_max']} />
          </Specimen>
        </>
      }
    />
  )
}
