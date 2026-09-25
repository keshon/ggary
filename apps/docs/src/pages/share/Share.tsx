import { Legend, Share, Stack } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { dayOutcomes, languages, nothing } from './data'

const SIZES = ['md', 'lg'] as const

export default function SharePage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="items[].tone" wide>
            <Share items={dayOutcomes} unit="h" label="The last 24 hours" locale="en-GB" />
          </Specimen>
          <Specimen label="items[].series" wide>
            <Share items={languages} unit="lines" label="Lines by language" locale="en-GB" />
          </Specimen>
        </>
      }
      sizes={SIZES.map((size) => (
        <Specimen key={size} label={`size="${size}"`} wide>
          <Share items={dayOutcomes} unit="h" label="The last 24 hours" size={size} locale="en-GB" />
        </Specimen>
      ))}
      states={
        <Specimen label="every value 0" wide>
          <Share items={nothing} unit="h" label="The last 24 hours" locale="en-GB" />
        </Specimen>
      }
      composition={
        <Specimen label="keyed by a Legend" wide>
          <Stack gap="tight">
            <Share items={languages} unit="lines" label="Lines by language" locale="en-GB" />
            <Legend items={languages.map(({ label, series, value }) => ({ label, series, value: `${Math.round(value / 1000)}k` }))} label="Lines by language" />
          </Stack>
        </Specimen>
      }
    />
  )
}
