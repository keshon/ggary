<script lang="ts">
  import { Avatar, Badge, Cluster, ClusterSpacer, Flex, Kanban, Progress, Stack, Text } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { crowded, dealStages, deals, formatAmount, hold, manyDeals, stageAdding, stageLifted, stagePendingMove, type Deal } from './data'

  /** Runs `stage` on the board inside once, as the page loads. */
  const staged = (stage: (host: HTMLElement) => void) => (host: HTMLElement) => {
    requestAnimationFrame(() => stage(host))
  }
</script>

{#snippet body(deal: Deal)}
  <Stack gap="tight">
    <Text emphasis="low">{deal.company}</Text>
    {#if deal.labels}
      <Cluster gap="tight">
        {#each deal.labels as label (label)}<Badge emphasis="low">{label}</Badge>{/each}
      </Cluster>
    {/if}
    {#if deal.checklist}
      <Progress
        size="sm"
        value={deal.checklist.done}
        max={deal.checklist.total}
        label={`Checklist, ${deal.checklist.done} of ${deal.checklist.total}`}
        valueText={`${deal.checklist.done} of ${deal.checklist.total}`}
        hideLabel
        tone={deal.checklist.done === deal.checklist.total ? 'ok' : 'running'}
      />
    {/if}
    <Cluster gap="tight">
      <Text strong>{formatAmount(deal.amount)}</Text>
      {#if deal.due}<Badge tone={deal.due.tone}>{deal.due.text}</Badge>{/if}
      <ClusterSpacer />
      {#if deal.owner}<Avatar name={deal.owner} size="sm" />{/if}
    </Cluster>
  </Stack>
{/snippet}

<DemoPage>
  {#snippet variants()}
    <Specimen label="titles only" wide><Kanban columns={dealStages} cards={deals} words={{ label: 'Deals' }} /></Specimen>
    <Specimen label="card body" wide><Kanban columns={dealStages} cards={deals} words={{ label: 'Deals' }} card={body} /></Specimen>
    <Specimen label="onAdd" wide><Kanban columns={dealStages} cards={deals} onAdd={hold} words={{ label: 'Deals' }} /></Specimen>
  {/snippet}
  {#snippet states()}
    <Specimen label="limit · over the limit · empty" wide><Kanban columns={dealStages} cards={crowded} words={{ label: 'Deals' }} /></Specimen>
    <Specimen label="lifted" wide>
      <div {@attach staged(stageLifted)}><Kanban columns={dealStages} cards={deals} onMove={hold} words={{ label: 'Deals' }} /></div>
    </Specimen>
    <Specimen label="moving" wide>
      <div {@attach staged(stagePendingMove)}><Kanban columns={dealStages} cards={deals} onMove={hold} words={{ label: 'Deals' }} /></div>
    </Specimen>
    <Specimen label="adding · added, saving" wide>
      <div {@attach staged(stageAdding)}><Kanban columns={dealStages} cards={deals} onAdd={hold} words={{ label: 'Deals' }} /></div>
    </Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="in a set height, each column scrolls" wide>
      <Flex direction="column" style="block-size: 26rem">
        <Kanban columns={dealStages} cards={manyDeals} onAdd={hold} words={{ label: 'Deals' }} card={body} />
      </Flex>
    </Specimen>
  {/snippet}
</DemoPage>
