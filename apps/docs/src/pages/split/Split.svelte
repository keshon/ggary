<script lang="ts">
  import { List, ListItem, Panel, Split, Text } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { leads } from '../../data/layout'

  /** A split fills its frame; on a page the frame is a stage's. */
  const across = 'block-size: 260px'
  const down = 'block-size: 360px'
  const side = { defaultSize: 240, min: 180, max: 420, restMin: 220 }
  const top = { defaultSize: 150, min: 100, max: 240, restMin: 120 }
</script>

{#snippet list()}
  <List ariaLabel="Leads">
    {#each leads as lead, index (lead)}<ListItem title={lead} onSelect={() => {}} current={index === 0 || undefined} />{/each}
  </List>
{/snippet}

{#snippet lead()}
  <Panel plain title={leads[0]} headingLevel={3}><Text emphasis="low">Last call 2 days ago · owner Daria M.</Text></Panel>
{/snippet}

{#snippet activity()}
  <Panel plain title="Activity" headingLevel={3}><Text emphasis="low">Proposal sent · 14:30</Text></Panel>
{/snippet}

{#snippet detail()}
  <Split label="Resize the lead" orientation="vertical" style="block-size: 100%" first={lead} second={activity} {...top} />
{/snippet}

<DemoPage>
  {#snippet variants()}
    <Specimen label={`orientation="horizontal"`} wide>
      <Split label="Resize the lead list" style={across} first={list} second={lead} {...side} />
    </Specimen>
    <Specimen label={`orientation="vertical"`} wide>
      <Split label="Resize the lead list" orientation="vertical" style={down} first={list} second={lead} {...top} />
    </Specimen>
    <Specimen label={`primary="end"`} wide>
      <Split label="Resize the lead" primary="end" style={across} first={list} second={lead} {...side} />
    </Specimen>
  {/snippet}
  {#snippet states()}
    <Specimen label="collapsible collapsed" wide>
      <Split label="Resize the lead list" collapsible collapsed style={across} first={list} second={lead} {...side} />
    </Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="Split in a pane" wide>
      <Split label="Resize the lead list" style={down} first={list} second={detail} {...side} />
    </Specimen>
  {/snippet}
</DemoPage>
