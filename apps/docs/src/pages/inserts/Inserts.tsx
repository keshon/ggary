import { Field, Input, Inserts, Stack, Textarea } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { named, subject, template, variables } from './data'

export default function InsertsPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="items: { value, hint }" wide>
            <Field label="Notification template">
              <Textarea rows={3} defaultValue={template} />
              <Inserts items={variables} label="Template variables" />
            </Field>
          </Specimen>
          <Specimen label="items: { value, label }" wide>
            <Field label="Notification template">
              <Textarea rows={3} defaultValue={template} />
              <Inserts items={named} label="Template variables" />
            </Field>
          </Specimen>
        </>
      }
      composition={
        <Specimen label={`target="insert-subject"`} wide>
          <Stack gap="tight">
            <Input id="insert-subject" aria-label="Subject" defaultValue={subject} />
            <Inserts items={variables} target="insert-subject" label="Subject variables" />
          </Stack>
        </Specimen>
      }
    />
  )
}
