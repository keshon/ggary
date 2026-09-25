import type { ReactNode } from 'react'
import { Badge, Copyable, KeyValueList, Link } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { richFacts, runFacts } from './data'

const rich = (label: string, value: string): ReactNode =>
  label === 'Status' ? <Badge tone="running">{value}</Badge> : label === 'Runner' ? <Link href="#/key-value-list">{value}</Link> : <Copyable value={value} />

export default function KeyValueListPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="no props" wide>
            <KeyValueList items={runFacts} />
          </Specimen>
          <Specimen label="tight" wide>
            <KeyValueList items={runFacts} tight />
          </Specimen>
        </>
      }
      composition={
        <Specimen label="value: Badge · Link · Copyable" wide>
          <KeyValueList items={richFacts.map(({ label, value }) => ({ label, value: rich(label, value) }))} />
        </Specimen>
      }
    />
  )
}
