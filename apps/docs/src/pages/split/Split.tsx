import { List, ListItem, Panel, Split, Text } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { leads } from '../../data/layout'

/** A split fills its frame; on a page the frame is a stage's. */
const across = { blockSize: 260 }
const down = { blockSize: 360 }
const side = { defaultSize: 240, min: 180, max: 420, restMin: 220 }
const top = { defaultSize: 150, min: 100, max: 240, restMin: 120 }

function Leads() {
  return (
    <List ariaLabel="Leads">
      {leads.map((lead, index) => (
        <ListItem key={lead} title={lead} onSelect={() => {}} current={index === 0 || undefined} />
      ))}
    </List>
  )
}

function Lead() {
  return (
    <Panel plain title={leads[0]} headingLevel={3}>
      <Text emphasis="low">Last call 2 days ago · owner Daria M.</Text>
    </Panel>
  )
}

export default function SplitPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label={`orientation="horizontal"`} wide>
            <Split label="Resize the lead list" style={across} {...side}>
              <Leads />
              <Lead />
            </Split>
          </Specimen>
          <Specimen label={`orientation="vertical"`} wide>
            <Split label="Resize the lead list" orientation="vertical" style={down} {...top}>
              <Leads />
              <Lead />
            </Split>
          </Specimen>
          <Specimen label={`primary="end"`} wide>
            <Split label="Resize the lead" primary="end" style={across} {...side}>
              <Leads />
              <Lead />
            </Split>
          </Specimen>
        </>
      }
      states={
        <Specimen label="collapsible collapsed" wide>
          <Split label="Resize the lead list" collapsible collapsed style={across} {...side}>
            <Leads />
            <Lead />
          </Split>
        </Specimen>
      }
      composition={
        <Specimen label="Split in a pane" wide>
          <Split label="Resize the lead list" style={down} {...side}>
            <Leads />
            <Split label="Resize the lead" orientation="vertical" style={{ blockSize: '100%' }} {...top}>
              <Lead />
              <Panel plain title="Activity" headingLevel={3}>
                <Text emphasis="low">Proposal sent · 14:30</Text>
              </Panel>
            </Split>
          </Split>
        </Specimen>
      }
    />
  )
}
