import { useState } from 'react'
import { Button, Cluster, Combobox, DatePicker, CheckboxGroup, Field, FieldControl, Fieldset, Form, FormSummary, RadioGroup, Input, Select, Stack } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { companies, stages } from '../../data/inputs-pickers'
import { dealRules, saveDeal, submitOnLoad } from './data'

function NativeAndGroupForm() {
  const [saved, setSaved] = useState('')
  return <Form onReset={() => setSaved('')} onSubmit={data => {
    if (data.getAll('channels').includes('digest')) return { errors: { channels: 'Digest delivery is temporarily unavailable. Choose another channel.' } }
    setSaved(`Saved settings for ${data.get('code')}, company ${data.get('company')}, reviewers ${data.getAll('reviewers').join(', ')}.`)
  }}>
    <Stack>
      <FormSummary />
      <Field name="code" label="Project code" hint="Three uppercase letters and three digits, e.g. APP-123" required error="Use the format APP-123">
        <FieldControl pattern="[A-Z]{3}-[0-9]{3}" placeholder="APP-123" render={<input data-scope="input" data-part="root" />} />
      </Field>
      <Field name="stage" label="Project stage" required error="Choose a project stage" hint="Select inherits its name and native required constraint from Field.">
        <Select items={stages} />
      </Field>
      <Field name="company" label="Project company" required error="Choose a company" hint="Search text is not a selection: select a result to satisfy required.">
        <Combobox items={companies} />
      </Field>
      <Field name="reviewers" label="Reviewers" required error="Choose at least one reviewer" hint="Multiple selection submits one value per chip.">
        <Combobox multiple items={[{ value: 'alex', label: 'Alex' }, { value: 'sam', label: 'Sam' }]} />
      </Field>
      <Field name="owner" label="Project owner" readOnly hint="Read-only Combobox permits browsing and keeps its selection.">
        <Combobox defaultValue="alex" items={[{ value: 'alex', label: 'Alex' }, { value: 'sam', label: 'Sam' }]} />
      </Field>
      <Field name="policy" label="Delivery policy" readOnly hint="Read-only Select permits browsing without changing its submitted value.">
        <Select defaultValue="immediate" items={[{ value: 'immediate', label: 'Immediate' }, { value: 'scheduled', label: 'Scheduled' }]} />
      </Field>
      <Fieldset name="channels" legend="Notification channels" required error="Choose at least one channel" hint="Digest demonstrates a server-side error on save.">
        <CheckboxGroup items={[{ value: 'mentions', label: 'Mentions' }, { value: 'replies', label: 'Replies' }, { value: 'digest', label: 'Weekly digest' }]} />
      </Fieldset>
      <RadioGroup name="frequency" label="Frequency" defaultValue="immediate" items={[{ value: 'immediate', label: 'As it happens' }, { value: 'hourly', label: 'Hourly summary' }]} />
      <Cluster>
        <Button emphasis="high" type="submit">Save settings</Button>
        <Button type="reset">Reset</Button>
      </Cluster>
      <p role="status">{saved || 'No saved settings yet.'}</p>
    </Stack>
  </Form>
}

export default function FormPage() {
  return (
    <DemoPage
      composition={<Specimen label="Custom native control + named groups" wide><NativeAndGroupForm /></Specimen>}
      states={
        <>
          <Specimen label="onSubmit · FormSummary" wide>
            <div ref={submitOnLoad}>
              <Form validate={dealRules} onSubmit={saveDeal}>
                <Stack>
                  <FormSummary />
                  <Field name="title" label="Deal title">
                    <Input name="title" required defaultValue="Annual licence" />
                  </Field>
                  <Combobox name="company" label="Company" items={companies} defaultValue="acme" />
                  <Select name="stage" label="Stage" items={stages} defaultValue="talks" />
                  <DatePicker name="due" label="Close by" locale="en-GB" defaultValue="2026-11-30" />
                  <Button emphasis="high" type="submit">
                    Create deal
                  </Button>
                </Stack>
              </Form>
            </div>
          </Specimen>
          <Specimen label="validate · FormSummary" wide>
            <div ref={submitOnLoad}>
              <Form validate={dealRules} onSubmit={saveDeal}>
                <Stack>
                  <FormSummary />
                  <Field name="title" label="Deal title" error="Give the deal a title">
                    <Input name="title" required />
                  </Field>
                  <Combobox name="company" label="Company" items={companies} placeholder="Type to search" />
                  <Select name="stage" label="Stage" items={stages} defaultValue="offer" />
                  <Field name="amount" label="Amount, €" hint="Required once an offer is sent">
                    <Input name="amount" type="number" min={0} step={1000} />
                  </Field>
                  <DatePicker name="due" label="Close by" locale="en-GB" />
                  <Field name="contact" label="Contact email" error="Enter a valid email address">
                    <Input name="contact" type="email" defaultValue="anna.petrova@" />
                  </Field>
                  <Button emphasis="high" type="submit">
                    Create deal
                  </Button>
                </Stack>
              </Form>
            </div>
          </Specimen>
        </>
      }
    />
  )
}
