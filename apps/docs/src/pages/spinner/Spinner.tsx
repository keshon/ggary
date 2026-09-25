import { Spinner } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { SIZES } from '../../data/display'

export default function SpinnerPage() {
  return (
    <DemoPage
      sizes={SIZES.map((size) => (
        <Specimen key={size} label={`size="${size}"`}>
          <Spinner label="Loading runs" size={size} />
        </Specimen>
      ))}
    />
  )
}
