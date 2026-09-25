import { Cluster, Copyable, Text } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { hash, leadId, path } from './data'

export default function CopyablePage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="value">
            <Copyable value={leadId} />
          </Specimen>
          <Specimen label="value · copyValue">
            <Copyable value={hash.value} copyValue={hash.copyValue} />
          </Specimen>
        </>
      }
      states={
        <Specimen label="long value">
          <Copyable value={path} />
        </Specimen>
      }
      composition={
        <Specimen label="beside a label">
          <Cluster gap="tight">
            <Text emphasis="low">Build</Text>
            <Copyable value={hash.value} copyValue={hash.copyValue} />
          </Cluster>
        </Specimen>
      }
    />
  )
}
