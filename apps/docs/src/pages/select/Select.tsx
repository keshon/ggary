import { Select } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { stages } from '../../data/inputs-pickers'

const SIZES = ['sm', 'md', 'lg'] as const

export default function SelectPage() {
  return (
    <DemoPage
      sizes={SIZES.map((size) => (
        <Specimen key={size} label={`size="${size}"`}>
          <Select size={size} label="Stage" items={stages} defaultValue="talks" />
        </Specimen>
      ))}
      states={
        <>
          <Specimen label="placeholder">
            <Select label="Stage" items={stages} placeholder="Choose a stage" />
          </Specimen>
          <Specimen label="defaultValue">
            <Select label="Stage" items={stages} defaultValue="offer" />
          </Specimen>
          <Specimen label="disabled">
            <Select label="Stage" items={stages} defaultValue="won" disabled />
          </Specimen>
        </>
      }
    />
  )
}
