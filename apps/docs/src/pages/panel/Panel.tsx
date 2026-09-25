import { Badge, Button, CodeBlock, List, ListItem, Panel, Toolbar, ToolbarSeparator, ToolbarSpacer } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { leads, runners } from '../../data/layout'

const RANKS = ['lead', 'default', 'support'] as const

function Leads({ count }: { count: number }) {
  return (
    <List ariaLabel="Leads">
      {leads.slice(0, count).map((lead) => (
        <ListItem key={lead} title={lead} />
      ))}
    </List>
  )
}

export default function PanelPage() {
  return (
    <DemoPage
      variants={
        <>
          {RANKS.map((rank) => (
            <Specimen key={rank} label={`rank="${rank}"`}>
              <Panel title="Runners" headingLevel={3} rank={rank}>
                5 runners, 1 building.
              </Panel>
            </Specimen>
          ))}
          <Specimen label="plain">
            <Panel title="Runners" headingLevel={3} plain>
              5 runners, 1 building.
            </Panel>
          </Specimen>
          {runners.map((runner) => (
            <Specimen key={runner.tone} label={`tone="${runner.tone}"`}>
              <Panel title={runner.name} headingLevel={3} tone={runner.tone}>
                {runner.line}
              </Panel>
            </Specimen>
          ))}
          <Specimen label={`body="padded"`}>
            <Panel title="Runners" headingLevel={3} body="padded">
              5 runners, 1 building.
            </Panel>
          </Specimen>
          <Specimen label={`body="flush"`}>
            <Panel title="Deploy" headingLevel={3} body="flush">
              <CodeBlock label="the deploy command" code="npm run deploy -- --preview" />
            </Panel>
          </Specimen>
          <Specimen label={`body="list"`}>
            <Panel title="Leads" headingLevel={3} body="list">
              <Leads count={3} />
            </Panel>
          </Specimen>
        </>
      }
      states={
        <Specimen label="scrollable">
          <Panel title="Leads" headingLevel={3} body="list" scrollable style={{ blockSize: 200 }}>
            <Leads count={7} />
          </Panel>
        </Specimen>
      }
      composition={
        <>
          <Specimen label="actions" wide>
            <Panel
              title="Runners"
              headingLevel={3}
              actions={
                <Button emphasis="minimal" size="sm">
                  Add runner
                </Button>
              }
            >
              5 runners, 1 building.
            </Panel>
          </Specimen>
          <Specimen label="toolbar" wide>
            <Panel
              title="Runs"
              headingLevel={3}
              toolbar={
                <Toolbar label="Run tools">
                  <Button size="sm" emphasis="minimal">
                    Filter
                  </Button>
                  <Button size="sm" emphasis="minimal">
                    Sort
                  </Button>
                  <ToolbarSeparator />
                  <Button size="sm" emphasis="minimal">
                    Export
                  </Button>
                  <ToolbarSpacer />
                  <Badge tone="running">7 running</Badge>
                </Toolbar>
              }
              body="list"
            >
              <Leads count={3} />
            </Panel>
          </Specimen>
        </>
      }
    />
  )
}
