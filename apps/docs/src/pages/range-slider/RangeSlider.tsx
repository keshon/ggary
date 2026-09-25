import { RangeSlider } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { euro, minutes } from './data'

const SIZES = ['sm', 'md', 'lg'] as const
const DISPLAYS = ['header', 'bubbles', 'inputs'] as const

export default function RangeSliderPage() {
  return (
    <DemoPage
      variants={DISPLAYS.map((valueDisplay) => (
        <Specimen key={valueDisplay} label={`valueDisplay="${valueDisplay}"`} wide>
          <RangeSlider label="Price" valueDisplay={valueDisplay} prefix="€" min={0} max={200} step={5} defaultValue={[40, 120]} formatValue={euro} />
        </Specimen>
      ))}
      sizes={SIZES.map((size) => (
        <Specimen key={size} label={`size="${size}"`} wide>
          <RangeSlider size={size} label="Price" min={0} max={200} step={5} defaultValue={[40, 120]} formatValue={euro} />
        </Specimen>
      ))}
      states={
        <>
          <Specimen label={`valueDisplay="bubbles" defaultValue={[60, 75]}`} wide>
            <RangeSlider label="Budget" valueDisplay="bubbles" min={0} max={200} step={5} defaultValue={[60, 75]} formatValue={euro} />
          </Specimen>
          <Specimen label="disabled" wide>
            <RangeSlider label="Retries" min={0} max={10} defaultValue={[1, 3]} marks={[0, 5, 10]} disabled />
          </Specimen>
          <Specimen label="invalid" wide>
            <RangeSlider label="Price" min={0} max={200} step={5} defaultValue={[0, 200]} formatValue={euro} invalid />
          </Specimen>
        </>
      }
      composition={
        <>
          <Specimen label="marks" wide>
            <RangeSlider label="Run time" min={0} max={60} defaultValue={[2, 45]} formatValue={minutes} marks={[0, 15, 30, 45, 60]} />
          </Specimen>
          <Specimen label={`valueDisplay="inputs" suffix="min" minGap={5}`} wide>
            <RangeSlider label="Run time" valueDisplay="inputs" suffix="min" min={0} max={60} minGap={5} defaultValue={[10, 30]} formatValue={minutes} name={['time_min', 'time_max']} />
          </Specimen>
        </>
      }
    />
  )
}
