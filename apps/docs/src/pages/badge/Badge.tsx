import { Avatar, Badge, Icon } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'

const TONES = [
  ['neutral', 'Draft'],
  ['running', 'Running'],
  ['ok', 'Passed'],
  ['warn', 'Slow'],
  ['error', 'Failed'],
] as const

export default function BadgePage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="no tone">
            <Badge>Beta</Badge>
          </Specimen>
          {TONES.map(([tone, word]) => (
            <Specimen key={tone} label={`tone="${tone}"`}>
              <Badge tone={tone}>{word}</Badge>
            </Specimen>
          ))}
          {TONES.map(([tone, word]) => (
            <Specimen key={`low-${tone}`} label={`tone="${tone}" emphasis="low"`}>
              <Badge tone={tone} emphasis="low">
                {word}
              </Badge>
            </Specimen>
          ))}
        </>
      }
      states={
        <Specimen label="dot={false}">
          <Badge tone="ok" dot={false}>
            Passed
          </Badge>
        </Specimen>
      }
      composition={
        <>
          <Specimen label="count, on an icon">
            <Icon name="bell" size="lg" />
            <Badge count tone="error">
              3
            </Badge>
          </Specimen>
          <Specimen label="count, beside an avatar">
            <Avatar name="Anna Petrova" />
            <Badge count>12</Badge>
          </Specimen>
        </>
      }
    />
  )
}
