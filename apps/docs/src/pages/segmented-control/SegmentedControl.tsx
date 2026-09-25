import { SegmentedControl } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { densities, viewModes, viewModesWithLocked } from './data'

const SIZES = ['sm', 'md', 'lg'] as const

export default function SegmentedControlPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="no fullWidth">
            <SegmentedControl label="View mode" items={viewModes} defaultValue="list" />
          </Specimen>
          <Specimen label="fullWidth" wide>
            <SegmentedControl label="Row density" fullWidth items={densities} defaultValue="regular" />
          </Specimen>
        </>
      }
      sizes={SIZES.map((size) => (
        <Specimen key={size} label={`size="${size}"`}>
          <SegmentedControl label={`Row density, ${size}`} size={size} items={densities} defaultValue="compact" />
        </Specimen>
      ))}
      states={
        <>
          <Specimen label="no value">
            <SegmentedControl label="View mode" items={viewModes} />
          </Specimen>
          <Specimen label="items[].disabled">
            <SegmentedControl label="View mode" items={viewModesWithLocked} defaultValue="grid" />
          </Specimen>
          <Specimen label="disabled">
            <SegmentedControl label="View mode" disabled items={viewModes} defaultValue="list" />
          </Specimen>
          <Specimen label="required">
            <SegmentedControl label="View mode" required items={viewModes} />
          </Specimen>
        </>
      }
    />
  )
}
