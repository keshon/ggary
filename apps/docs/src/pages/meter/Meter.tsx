import { Meter } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { SIZES } from '../../data/display'
import { toned } from './data'

const tokens = { label: 'Tokens', value: 184_320, max: 250_000, locale: 'en-GB' }

export default function MeterPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="no tone" wide>
            <Meter {...tokens} />
          </Specimen>
          {toned.map(({ tone, label, value, max }) => (
            <Specimen key={tone} label={`tone="${tone}"`} wide>
              <Meter label={label} value={value} max={max} tone={tone} locale="en-GB" />
            </Specimen>
          ))}
        </>
      }
      sizes={SIZES.map((size) => (
        <Specimen key={size} label={`size="${size}"`} wide>
          <Meter {...tokens} size={size} />
        </Specimen>
      ))}
      states={
        <>
          <Specimen label="value over max" wide>
            <Meter {...tokens} value={262_144} />
          </Specimen>
          <Specimen label="showValue={false}" wide>
            <Meter {...tokens} showValue={false} />
          </Specimen>
          <Specimen label="hideLabel" wide>
            <Meter {...tokens} hideLabel />
          </Specimen>
        </>
      }
      composition={
        <Specimen label={`valueText="237 of 240 GB"`} wide>
          <Meter label="Disk on the runner" value={237} max={240} tone="warn" valueText="237 of 240 GB" />
        </Specimen>
      }
    />
  )
}
