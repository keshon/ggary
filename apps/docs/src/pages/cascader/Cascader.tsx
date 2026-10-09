import { useState } from 'react'
import { Button, Cluster, Cascader, ConfigProvider, Field, Fieldset, Form, FormSummary, Stack } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { regions, teams } from './data'

function CascaderForm() {
  const [saved, setSaved] = useState('')
  return <Form onReset={() => setSaved('')} onSubmit={data => {
    if (data.get('city') === 'chelny') return { errors: { city: 'Delivery to Naberezhnye Chelny is temporarily unavailable.' } }
    setSaved(`Saved city: ${data.get('city')}; region: ${data.get('territory')}. Archived city submitted: ${data.has('archived') ? 'yes' : 'no'}.`)
  }}>
    <Stack>
      <FormSummary />
      <Field name="city" label="Shipping city" required error="Choose a city" hint="A branch is not a selection. Naberezhnye Chelny demonstrates a server error on save.">
        <Cascader items={regions} placeholder="Choose a city" />
      </Field>
      <Field name="territory" label="Read-only region" readOnly hint="Browse the tree; the submitted region stays Tatarstan.">
        <Cascader items={regions} selectParents defaultValue={['ru', 'tat']} />
      </Field>
      <Fieldset disabled legend="Disabled section">
        <Cascader items={regions} name="archived" label="Archived city" defaultValue={['kz', 'ala']} />
      </Fieldset>
      <Cluster><Button type="submit" emphasis="high">Save choices</Button><Button type="reset">Reset choices</Button></Cluster>
      <p role="status">{saved || 'No choices saved yet.'}</p>
    </Stack>
  </Form>
}

const SIZES = ['sm', 'md', 'lg'] as const

export default function CascaderPage() {
  return (
    <DemoPage
      sizes={SIZES.map((size) => (
        <Specimen key={size} label={`size="${size}"`}>
          <Cascader size={size} label="City" items={regions} defaultValue={['rs', 'beg']} />
        </Specimen>
      ))}
      states={
        <>
          <Specimen label="placeholder">
            <Cascader label="City" items={regions} placeholder="Choose a city" />
          </Specimen>
          <Specimen label="defaultValue">
            <Cascader label="City" items={regions} defaultValue={['ru', 'tat', 'kzn']} />
          </Specimen>
          <Specimen label="disabled">
            <Cascader label="City" items={regions} defaultValue={['kz', 'ala']} disabled />
          </Specimen>
        </>
      }
      composition={
        <>
          <Specimen label="Field · native required, server errors, read-only and reset" wide><CascaderForm /></Specimen>
          <Specimen label="selectParents">
            <Cascader label="Team" items={teams} selectParents defaultValue={['sales', 'smb']} placeholder="Any team" />
          </Specimen>
          <Specimen label='Base UI · local dark, dir="rtl"'>
            <ConfigProvider mode="dark" dir="rtl">
              <Cascader label="RTL city" items={regions} defaultValue={['ru', 'tat', 'kzn']} />
            </ConfigProvider>
          </Specimen>
        </>
      }
    />
  )
}
