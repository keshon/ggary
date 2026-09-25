import { Chip } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'

const EMPHASES = ['low', 'medium', 'high'] as const
const SIZES = ['sm', 'md', 'lg'] as const

export default function ChipPage() {
  return (
    <DemoPage
      variants={EMPHASES.map((emphasis) => (
        <Specimen key={emphasis} label={`emphasis="${emphasis}"`}>
          <Chip emphasis={emphasis}>Design</Chip>
        </Specimen>
      ))}
      sizes={SIZES.map((size) => (
        <Specimen key={size} label={`size="${size}"`}>
          <Chip size={size}>Design</Chip>
        </Specimen>
      ))}
      states={
        <>
          <Specimen label="interactive">
            <Chip interactive>Design</Chip>
          </Specimen>
          <Specimen label="interactive selected">
            <Chip interactive selected>
              Design
            </Chip>
          </Specimen>
          <Specimen label="interactive disabled">
            <Chip interactive disabled>
              Legacy
            </Chip>
          </Specimen>
          <Specimen label="onRemove">
            <Chip onRemove={() => {}}>Design</Chip>
          </Specimen>
          <Specimen label="onRemove disabled">
            <Chip onRemove={() => {}} disabled>
              Legacy
            </Chip>
          </Specimen>
        </>
      }
    />
  )
}
