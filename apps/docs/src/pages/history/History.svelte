<script lang="ts">
  import { History, KeyValueList } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { runHistory } from '../../data/agent'
  import { everyTick, runHistoryHours, workflows } from './data'

  const SIZES = ['sm', 'md', 'lg'] as const
</script>

<DemoPage>
  {#snippet variants()}
    <Specimen label="ticks"><History ticks={runHistory} locale="en-GB" /></Specimen>
    <Specimen label="groups" wide><History groups={runHistoryHours} size="lg" label="Nightly audits by the hour" locale="en-GB" /></Specimen>
  {/snippet}
  {#snippet sizes()}
    {#each SIZES as size (size)}
      <Specimen label={`size="${size}"`}><History ticks={runHistory} {size} locale="en-GB" /></Specimen>
    {/each}
  {/snippet}
  {#snippet states()}
    <Specimen label={`tone="ok" · "warn" · "error" · empty · no tone · "running"`}><History ticks={everyTick} size="lg" locale="en-GB" /></Specimen>
    <Specimen label={"ticks={[]}"}><History ticks={[]} size="lg" locale="en-GB" /></Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="beside names, in a KeyValueList" wide>
      <KeyValueList items={workflows}>
        {#snippet value(workflow)}<History ticks={workflow.ticks} label={workflow.label} locale="en-GB" />{/snippet}
      </KeyValueList>
    </Specimen>
  {/snippet}
</DemoPage>
