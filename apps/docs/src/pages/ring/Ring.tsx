import { Cluster, Ring, Text } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { SIZES, TONES } from '../../data/display'

const nightly = { label: 'Nightly window used', value: 74, locale: 'en-GB' }

export default function RingPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="no tone">
            <Ring {...nightly} />
          </Specimen>
          {TONES.map((tone) => (
            <Specimen key={tone} label={`tone="${tone}"`}>
              <Ring {...nightly} tone={tone} />
            </Specimen>
          ))}
        </>
      }
      sizes={SIZES.map((size) => (
        <Specimen key={size} label={`size="${size}"`}>
          <Ring {...nightly} size={size} />
        </Specimen>
      ))}
      states={
        <>
          <Specimen label={`size="lg" · value over max`}>
            <Ring label="Shards finished" value={72} max={60} size="lg" locale="en-GB" />
          </Specimen>
          <Specimen label={`size="lg" showValue={false}`}>
            <Ring {...nightly} size="lg" showValue={false} />
          </Specimen>
        </>
      }
      composition={
        <Specimen label="decorative, beside its words">
          <Cluster gap="tight">
            <Ring value={18} max={60} decorative locale="en-GB" />
            <Text>18 of 60 shards finished</Text>
          </Cluster>
        </Specimen>
      }
    />
  )
}
