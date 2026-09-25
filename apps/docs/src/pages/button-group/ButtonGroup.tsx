import { Button, ButtonGroup, Icon, Menu } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { runMenu } from './data'

const EMPHASES = ['high', 'medium', 'low', 'minimal'] as const
const SIZES = ['sm', 'md', 'lg'] as const

export default function ButtonGroupPage() {
  return (
    <DemoPage
      variants={EMPHASES.map((emphasis) => (
        <Specimen key={emphasis} label={`emphasis="${emphasis}"`}>
          <ButtonGroup>
            <Button emphasis={emphasis}>Run</Button>
            <Button emphasis={emphasis}>Schedule</Button>
          </ButtonGroup>
        </Specimen>
      ))}
      sizes={SIZES.map((size) => (
        <Specimen key={size} label={`size="${size}"`}>
          <ButtonGroup size={size}>
            <Button size={size} emphasis="medium">Left</Button>
            <Button size={size} emphasis="medium">Centre</Button>
            <Button size={size} emphasis="medium">Right</Button>
          </ButtonGroup>
        </Specimen>
      ))}
      states={
        <>
          <Specimen label="disabled">
            <ButtonGroup>
              <Button emphasis="medium">Run</Button>
              <Button emphasis="medium" disabled>Schedule</Button>
            </ButtonGroup>
          </Specimen>
          <Specimen label="loading">
            <ButtonGroup>
              <Button emphasis="medium" loading>Run</Button>
              <Button emphasis="medium">Schedule</Button>
            </ButtonGroup>
          </Specimen>
        </>
      }
      composition={
        <>
          <Specimen label={`label="History", icon only`}>
            <ButtonGroup label="History">
              <Button emphasis="medium" aria-label="Undo">
                <Icon name="undo" />
              </Button>
              <Button emphasis="medium" aria-label="Redo">
                <Icon name="redo" />
              </Button>
            </ButtonGroup>
          </Specimen>
          <Specimen label="icon + label">
            <ButtonGroup>
              <Button emphasis="medium">
                <Icon name="download" /> Export
              </Button>
              <Button emphasis="medium">
                <Icon name="share" /> Share
              </Button>
            </ButtonGroup>
          </Specimen>
          <Specimen label="Button + Menu">
            <ButtonGroup>
              <Button emphasis="high">Run</Button>
              <span>
                <Menu
                  items={runMenu}
                  label="Run options"
                  placement="bottom-end"
                  trigger={(props) => (
                    <Button emphasis="high" aria-label="Run options" {...props}>
                      <Icon name="chevron-down" />
                    </Button>
                  )}
                />
              </span>
            </ButtonGroup>
          </Specimen>
        </>
      }
    />
  )
}
