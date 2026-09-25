import { Button, Icon, Tooltip } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'

const PLACEMENTS = ['top', 'bottom', 'left', 'right'] as const

export default function TooltipPage() {
  return (
    <DemoPage
      variants={PLACEMENTS.map((placement) => (
        <Specimen key={placement} label={`placement="${placement}" open`}>
          <Tooltip
            open
            placement={placement}
            content="Bold (Ctrl+B)"
            trigger={(props) => (
              <Button emphasis="minimal" aria-label="Bold" {...props}>
                <b>B</b>
              </Button>
            )}
          />
        </Specimen>
      ))}
      states={
        <Specimen label="disabled">
          <Tooltip disabled content="Italic (Ctrl+I)" trigger={(props) => <Button emphasis="minimal" aria-label="Italic" {...props}><i>I</i></Button>} />
        </Specimen>
      }
      composition={
        <Specimen label="trigger, on an icon button">
          <Tooltip content="Settings" trigger={(props) => <Button emphasis="low" aria-label="Settings" {...props}><Icon name="settings" /></Button>} />
        </Specimen>
      }
    />
  )
}
