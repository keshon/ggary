<script lang="ts">
  import { Badge, Button, CodeBlock, List, ListItem, Panel, Toolbar, ToolbarSeparator, ToolbarSpacer } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { leads, runners } from '../../data/layout'

  const RANKS = ['lead', 'default', 'support'] as const
</script>

{#snippet list(count: number)}
  <List ariaLabel="Leads">{#each leads.slice(0, count) as lead (lead)}<ListItem title={lead} />{/each}</List>
{/snippet}

{#snippet addRunner()}<Button emphasis="minimal" size="sm">Add runner</Button>{/snippet}

{#snippet tools()}
  <Toolbar label="Run tools">
    <Button size="sm" emphasis="minimal">Filter</Button>
    <Button size="sm" emphasis="minimal">Sort</Button>
    <ToolbarSeparator />
    <Button size="sm" emphasis="minimal">Export</Button>
    <ToolbarSpacer />
    <Badge tone="running">7 running</Badge>
  </Toolbar>
{/snippet}

<DemoPage>
  {#snippet variants()}
    {#each RANKS as rank (rank)}
      <Specimen label={`rank="${rank}"`}><Panel title="Runners" headingLevel={3} {rank}>5 runners, 1 building.</Panel></Specimen>
    {/each}
    <Specimen label="plain"><Panel title="Runners" headingLevel={3} plain>5 runners, 1 building.</Panel></Specimen>
    {#each runners as runner (runner.tone)}
      <Specimen label={`tone="${runner.tone}"`}><Panel title={runner.name} headingLevel={3} tone={runner.tone}>{runner.line}</Panel></Specimen>
    {/each}
    <Specimen label={`body="padded"`}><Panel title="Runners" headingLevel={3} body="padded">5 runners, 1 building.</Panel></Specimen>
    <Specimen label={`body="flush"`}>
      <Panel title="Deploy" headingLevel={3} body="flush"><CodeBlock label="the deploy command" code="npm run deploy -- --preview" /></Panel>
    </Specimen>
    <Specimen label={`body="list"`}><Panel title="Leads" headingLevel={3} body="list">{@render list(3)}</Panel></Specimen>
  {/snippet}
  {#snippet states()}
    <Specimen label="scrollable">
      <Panel title="Leads" headingLevel={3} body="list" scrollable style="block-size: 200px">{@render list(7)}</Panel>
    </Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="actions" wide>
      <Panel title="Runners" headingLevel={3} actions={addRunner}>5 runners, 1 building.</Panel>
    </Specimen>
    <Specimen label="toolbar" wide>
      <Panel title="Runs" headingLevel={3} toolbar={tools} body="list">{@render list(3)}</Panel>
    </Specimen>
  {/snippet}
</DemoPage>
