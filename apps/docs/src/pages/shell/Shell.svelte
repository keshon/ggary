<script lang="ts">
  import { Breadcrumbs, Button, Card, Container, Grid, Nav, Rail, Shell, StatusBar, StatusBarItem, StatusBarSpacer } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { crumbs, navGroups, railItems, tiles } from '../../data/layout'

  /** A frame is the window's height; on a page it is given a stage's. */
  const frame = 'block-size: 400px'
  const COLLAPSES = ['drawer', 'bar'] as const
</script>

{#snippet work()}
  <Container size="full">
    <Grid columns="tight">
      {#each tiles.slice(0, 4) as tile (tile.title)}<Card title={tile.title}>{tile.value}</Card>{/each}
    </Grid>
  </Container>
{/snippet}

{#snippet status()}
  <StatusBar label="Workspace status">
    <StatusBarItem>Synced 2 min ago</StatusBarItem>
    <StatusBarItem tone="error">3 failed saves</StatusBarItem>
    <StatusBarSpacer />
    <StatusBarItem>700,000 leads</StatusBarItem>
    <Button size="sm" emphasis="minimal">Sync</Button>
  </StatusBar>
{/snippet}

{#snippet address()}<Breadcrumbs items={crumbs} />{/snippet}

<DemoPage>
  {#snippet variants()}
    {#each COLLAPSES as collapse (collapse)}
      <Specimen label={`collapse="${collapse}"`} wide>
        <Shell {collapse} style={frame} header={address} footer={status}>
          {#snippet brand()}<a href="#/shell">Leads</a>{/snippet}
          {#snippet aside()}<Nav label="Sections" groups={navGroups} />{/snippet}
          {@render work()}
        </Shell>
      </Specimen>
    {/each}
  {/snippet}
  {#snippet composition()}
    <Specimen label="aside: Rail" wide>
      <Shell style={frame} header={address}>
        {#snippet aside()}<Rail label="Workspaces" items={railItems} />{/snippet}
        {@render work()}
      </Shell>
    </Specimen>
    <Specimen label="header · footer, no aside" wide>
      <Shell style={frame} header={address} footer={status}>{@render work()}</Shell>
    </Specimen>
  {/snippet}
</DemoPage>
