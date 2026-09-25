import { Cluster, StatusDot, Text } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { toned } from './data'

export default function StatusDotPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="no tone">
            <Cluster gap="tight">
              <StatusDot />
              <Text>Idle</Text>
            </Cluster>
          </Specimen>
          {toned.map(({ tone, word }) => (
            <Specimen key={tone} label={`tone="${tone}"`}>
              <Cluster gap="tight">
                <StatusDot tone={tone} />
                <Text>{word}</Text>
              </Cluster>
            </Specimen>
          ))}
        </>
      }
      composition={
        <Specimen label={`no tone, inside Text tone="running"`}>
          <Text tone="running">
            <StatusDot /> Agents at work
          </Text>
        </Specimen>
      }
    />
  )
}
