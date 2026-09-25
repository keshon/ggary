import { Button, Icon } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'

const EMPHASES = ['high', 'medium', 'low', 'minimal'] as const
const SIZES = ['sm', 'md', 'lg'] as const

export default function ButtonPage() {
  return (
    <DemoPage
      variants={
        <>
          {EMPHASES.map((emphasis) => (
            <Specimen key={emphasis} label={`emphasis="${emphasis}"`}>
              <Button emphasis={emphasis}>Save</Button>
            </Specimen>
          ))}
          {EMPHASES.map((emphasis) => (
            <Specimen key={`destructive-${emphasis}`} label={`destructive emphasis="${emphasis}"`}>
              <Button destructive emphasis={emphasis}>Delete</Button>
            </Specimen>
          ))}
        </>
      }
      sizes={SIZES.map((size) => (
        <Specimen key={size} label={`size="${size}"`}>
          <Button size={size}>Save</Button>
        </Specimen>
      ))}
      states={
        <>
          <Specimen label="disabled">
            <Button disabled>Save</Button>
          </Specimen>
          <Specimen label="loading">
            <Button loading>Save</Button>
          </Specimen>
        </>
      }
      composition={
        <>
          <Specimen label="icon + label">
            <Button>
              <Icon name="plus" /> New
            </Button>
          </Specimen>
          <Specimen label="icon only, aria-label">
            <Button emphasis="low" aria-label="Settings">
              <Icon name="settings" />
            </Button>
          </Specimen>
          <Specimen label="fullWidth" wide>
            <Button fullWidth emphasis="high">
              Continue
            </Button>
          </Specimen>
        </>
      }
    />
  )
}
