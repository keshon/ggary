import { Cascader } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { regions, teams } from './data'

const SIZES = ['sm', 'md', 'lg'] as const

export default function CascaderPage() {
  return (
    <DemoPage
      sizes={SIZES.map((size) => (
        <Specimen key={size} label={`size="${size}"`}>
          <Cascader size={size} label="City" items={regions} defaultValue={['rs', 'beg']} />
        </Specimen>
      ))}
      states={
        <>
          <Specimen label="placeholder">
            <Cascader label="City" items={regions} placeholder="Choose a city" />
          </Specimen>
          <Specimen label="defaultValue">
            <Cascader label="City" items={regions} defaultValue={['ru', 'tat', 'kzn']} />
          </Specimen>
          <Specimen label="disabled">
            <Cascader label="City" items={regions} defaultValue={['kz', 'ala']} disabled />
          </Specimen>
        </>
      }
      composition={
        <Specimen label="selectParents">
          <Cascader label="Team" items={teams} selectParents defaultValue={['sales', 'smb']} placeholder="Any team" />
        </Specimen>
      }
    />
  )
}
