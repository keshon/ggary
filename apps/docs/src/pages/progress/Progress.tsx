import { Cluster, Progress, Text } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { SIZES } from '../../data/display'

const ofTotal = (value: number) => `${value} of 120`

export default function ProgressPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label={`shape="bar"`} wide>
            <Progress label="Importing leads" value={64} />
          </Specimen>
          <Specimen label={`shape="ring"`}>
            <Progress shape="ring" label="Importing leads" value={64} />
          </Specimen>
          <Specimen label={`tone="ok"`} wide>
            <Progress label="Import finished" value={100} tone="ok" />
          </Specimen>
          <Specimen label={`tone="warn"`} wide>
            <Progress label="Import stalled" value={40} tone="warn" />
          </Specimen>
          <Specimen label={`tone="error"`} wide>
            <Progress label="Sync with 1C" value={64} tone="error" />
          </Specimen>
        </>
      }
      sizes={
        <>
          {SIZES.map((size) => (
            <Specimen key={size} label={`size="${size}"`} wide>
              <Progress label="Importing leads" value={64} size={size} />
            </Specimen>
          ))}
          {SIZES.map((size) => (
            <Specimen key={`ring-${size}`} label={`shape="ring" size="${size}"`}>
              <Progress shape="ring" label="Storage" value={73} size={size} />
            </Specimen>
          ))}
        </>
      }
      states={
        <>
          <Specimen label="value={null}" wide>
            <Progress label="Connecting to 1C" value={null} />
          </Specimen>
          <Specimen label={`shape="ring" value={null}`}>
            <Progress shape="ring" label="Connecting" value={null} />
          </Specimen>
          <Specimen label="hideLabel" wide>
            <Progress label="Importing leads" value={64} hideLabel />
          </Specimen>
        </>
      }
      composition={
        <>
          <Specimen label="max={120} valueText={(value) => …}" wide>
            <Progress label="Importing leads" value={48} max={120} valueText={ofTotal} />
          </Specimen>
          <Specimen label={`tone="error" valueText="Failed at 64%"`} wide>
            <Progress label="Sync with 1C" value={64} tone="error" valueText="Failed at 64%" />
          </Specimen>
          <Specimen label={`shape="ring" hideLabel, beside its words`}>
            <Cluster gap="tight">
              <Progress shape="ring" label="Import" value={48} max={120} hideLabel />
              <Text emphasis="low">48 of 120 imported</Text>
            </Cluster>
          </Specimen>
        </>
      }
    />
  )
}
