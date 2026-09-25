import { TimePicker } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'

const SIZES = ['sm', 'md', 'lg'] as const

export default function TimePickerPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label={`locale="en-GB"`}>
            <TimePicker label="Call at" locale="en-GB" defaultValue="14:30" />
          </Specimen>
          <Specimen label={`locale="en-US"`}>
            <TimePicker label="Call at" locale="en-US" defaultValue="14:30" />
          </Specimen>
        </>
      }
      sizes={SIZES.map((size) => (
        <Specimen key={size} label={`size="${size}"`}>
          <TimePicker size={size} label="Starts" locale="en-GB" defaultValue="09:00" />
        </Specimen>
      ))}
      states={
        <Specimen label="empty">
          <TimePicker label="Call at" locale="en-GB" />
        </Specimen>
      }
    />
  )
}
