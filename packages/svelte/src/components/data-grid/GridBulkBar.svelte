<script lang="ts" generics="Row">
  import { getConfig } from '../config-provider/context'
  import { configWords } from '@ggary/core/config-provider'
  import { connectBulk, type BulkWords, type DataGridController } from '@ggary/core/data-grid'
  import { svelteNormalizer } from '@ggary/core'
  import { untrack, type Snippet } from 'svelte'

  let { grid, words: ownWords = {}, children }: { grid: DataGridController<Row>; words?: BulkWords; children?: Snippet } = $props()
  const kit = getConfig()
  const words = $derived(configWords(kit(), 'gridBulkBar', ownWords))

  let snapshot = $state.raw(untrack(() => grid.getSnapshot()))
  $effect(() => {
    snapshot = grid.getSnapshot()
    return grid.subscribe(() => (snapshot = grid.getSnapshot()))
  })
  const api = $derived(connectBulk(snapshot, grid, svelteNormalizer, { words }))
</script>

{#if api.visible}
  <div {...api.rootProps}>
    <span {...api.countProps}>{api.countText}</span>
    {#if api.offer}<button {...api.selectAllProps}>{api.selectAllText}</button>{/if}
    <button {...api.clearProps}>{api.clearText}</button>
    <div {...api.actionsProps}>{@render children?.()}</div>
  </div>
{/if}
