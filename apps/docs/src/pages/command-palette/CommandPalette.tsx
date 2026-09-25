import { Button, CommandPalette, Icon } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { commands, searchCompanies } from './data'

export default function CommandPalettePage() {
  return (
    <DemoPage
      states={
        <Specimen label="defaultOpen" wide>
          <div className="frame">
            <CommandPalette defaultOpen modal={false} hotkey={false} commands={commands} />
          </div>
        </Specimen>
      }
      composition={
        <Specimen label="load, hotkey={false}">
          <CommandPalette
            hotkey={false}
            commands={commands}
            load={searchCompanies}
            words={{ placeholder: 'Search leads or run a command…', results: 'Leads' }}
            trigger={(props) => (
              <Button emphasis="medium" {...props}>
                <Icon name="search" /> Search leads…
              </Button>
            )}
          />
        </Specimen>
      }
    />
  )
}
