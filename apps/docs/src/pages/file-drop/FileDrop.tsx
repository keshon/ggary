import { Field, FileDrop } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { holdFileOver } from './data'

const zone = { name: 'import', accept: '.json,.csv', multiple: true, hint: 'JSON or CSV · up to 20 MB' }

export default function FileDropPage() {
  return (
    <DemoPage
      states={
        <>
          <Specimen label="hint" wide>
            <FileDrop {...zone} />
          </Specimen>
          <Specimen label="files" wide>
            <FileDrop {...zone} files={['leads-2026-09.csv', 'contacts.json']} />
          </Specimen>
          <Specimen label="dragging" wide>
            <div ref={holdFileOver}>
              <FileDrop {...zone} />
            </div>
          </Specimen>
          <Specimen label="disabled" wide>
            <FileDrop {...zone} disabled />
          </Specimen>
          <Specimen label="invalid" wide>
            <FileDrop {...zone} invalid />
          </Specimen>
        </>
      }
      composition={
        <Specimen label="Field + FileDrop · invalid" wide>
          <Field label="Leads to import" error="Choose a file to import" invalid required>
            <FileDrop {...zone} required />
          </Field>
        </Specimen>
      }
    />
  )
}
