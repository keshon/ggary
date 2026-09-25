import { Flex, FlexItem, List, ListItem, Panel, Rail } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { leads, railItems } from '../../data/layout'

/** A rail is as tall as its column; on a page the column is a stage's. */
const column = { blockSize: 320 }

export default function RailPage() {
  return (
    <DemoPage
      states={
        <Specimen label="current · count · end">
          <div style={column}>
            <Rail label="Workspaces" items={railItems} />
          </div>
        </Specimen>
      }
      composition={
        <Specimen label="beside a Panel" wide>
          <Flex gap="none" style={column}>
            <Rail label="Workspaces" items={railItems} />
            <FlexItem grow>
              <Panel title="Leads" body="list" plain>
                <List ariaLabel="Leads">
                  {leads.slice(0, 4).map((lead) => (
                    <ListItem key={lead} title={lead} />
                  ))}
                </List>
              </Panel>
            </FlexItem>
          </Flex>
        </Specimen>
      }
    />
  )
}
