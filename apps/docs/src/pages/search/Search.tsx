import { Field, Search } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'

const SIZES = ['sm', 'md', 'lg'] as const

export default function SearchPage() {
  return (
    <DemoPage
      sizes={SIZES.map((size) => (
        <Specimen key={size} label={`size="${size}"`}>
          <Search size={size} label={`Search the runs, ${size}`} placeholder="worldgen" />
        </Specimen>
      ))}
      states={
        <>
          <Specimen label="placeholder">
            <Search label="Search the runs" placeholder="worldgen" />
          </Specimen>
          <Specimen label="defaultValue">
            <Search label="Search the runs" defaultValue="worldgen" />
          </Specimen>
          <Specimen label="disabled">
            <Search disabled label="Search the runs" placeholder="worldgen" />
          </Specimen>
          <Specimen label="readOnly">
            <Search readOnly label="Search the runs" defaultValue="worldgen" />
          </Specimen>
          <Specimen label="invalid">
            <Search invalid label="Search the runs" defaultValue="run:" />
          </Specimen>
          <Specimen label="required, in a Field">
            <Field label="Find a lead" required>
              <Search placeholder="Company or email" />
            </Field>
          </Specimen>
        </>
      }
      composition={
        <Specimen label="in a Field">
          <Field label="Search the runs" hint="By name, id or the agent that started it">
            <Search name="q" placeholder="worldgen" />
          </Field>
        </Specimen>
      }
    />
  )
}
