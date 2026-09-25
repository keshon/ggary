import { Breadcrumbs, Button, Card, Container, Grid, Nav, Rail, Shell, StatusBar, StatusBarItem, StatusBarSpacer } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { crumbs, navGroups, railItems, tiles } from '../../data/layout'

/** A frame is the window's height; on a page it is given a stage's. */
const frame = { blockSize: 400 }

function Work() {
  return (
    <Container size="full">
      <Grid columns="tight">
        {tiles.slice(0, 4).map((tile) => (
          <Card key={tile.title} title={tile.title}>
            {tile.value}
          </Card>
        ))}
      </Grid>
    </Container>
  )
}

function Footer() {
  return (
    <StatusBar label="Workspace status">
      <StatusBarItem>Synced 2 min ago</StatusBarItem>
      <StatusBarItem tone="error">3 failed saves</StatusBarItem>
      <StatusBarSpacer />
      <StatusBarItem>700,000 leads</StatusBarItem>
      <Button size="sm" emphasis="minimal">
        Sync
      </Button>
    </StatusBar>
  )
}

function Full({ collapse }: { collapse: 'drawer' | 'bar' }) {
  return (
    <Shell
      collapse={collapse}
      style={frame}
      brand={<a href="#/shell">Leads</a>}
      aside={<Nav label="Sections" groups={navGroups} />}
      header={<Breadcrumbs items={crumbs} />}
      footer={<Footer />}
    >
      <Work />
    </Shell>
  )
}

export default function ShellPage() {
  return (
    <DemoPage
      variants={(['drawer', 'bar'] as const).map((collapse) => (
        <Specimen key={collapse} label={`collapse="${collapse}"`} wide>
          <Full collapse={collapse} />
        </Specimen>
      ))}
      composition={
        <>
          <Specimen label="aside: Rail" wide>
            <Shell style={frame} aside={<Rail label="Workspaces" items={railItems} />} header={<Breadcrumbs items={crumbs} />}>
              <Work />
            </Shell>
          </Specimen>
          <Specimen label="header · footer, no aside" wide>
            <Shell style={frame} header={<Breadcrumbs items={crumbs} />} footer={<Footer />}>
              <Work />
            </Shell>
          </Specimen>
        </>
      }
    />
  )
}
