import { Field, Slider } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { agentsText } from './data'

const SIZES = ['sm', 'md', 'lg'] as const

export default function SliderPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="showValue" wide>
            <Slider label="Confidence threshold" step={5} defaultValue={80} showValue />
          </Specimen>
          <Specimen label="marks" wide>
            <Slider label="Retries" min={0} max={10} defaultValue={3} marks={[0, 5, 10]} />
          </Specimen>
          <Specimen label="showValue formatValue marks" wide>
            <Slider label="Parallel agents" min={0} max={16} defaultValue={6} showValue formatValue={agentsText} marks={[0, 4, 8, 12, 16]} />
          </Specimen>
        </>
      }
      sizes={SIZES.map((size) => (
        <Specimen key={size} label={`size="${size}"`} wide>
          <Slider size={size} label="Volume" defaultValue={60} showValue />
        </Specimen>
      ))}
      states={
        <>
          <Specimen label="disabled" wide>
            <Slider label="Volume" defaultValue={30} showValue disabled />
          </Specimen>
          <Specimen label="invalid" wide>
            <Slider label="Volume" defaultValue={95} showValue invalid />
          </Specimen>
        </>
      }
      composition={
        <Specimen label="Field + Slider" wide>
          <Field label="Confidence threshold" hint="Below it the agent asks before acting">
            <Slider step={5} defaultValue={80} showValue />
          </Field>
        </Specimen>
      }
    />
  )
}
