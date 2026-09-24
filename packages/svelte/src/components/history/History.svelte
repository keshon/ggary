<script lang="ts">
  import { getConfig } from '../config-provider/context'
  import { configWords } from '@ggary/core/config-provider'
  import { connect, type HistoryProps, type HistoryWords } from '@ggary/core/history'
  import { svelteNormalizer } from '@ggary/core'

  type Props = HistoryProps & {
    /** The fixed text of the strip's name. */
    words?: Partial<HistoryWords>
    [key: string]: unknown
  }

  /** What happened the last N times: one attempt, one mark, the latest at the end. */
  let { ticks, groups, label, size, locale: ownLocale, words: ownWords, ...rest }: Props = $props()
  const kit = getConfig()
  const locale = $derived(ownLocale ?? kit().locale)
  const words = $derived(configWords(kit(), 'history', ownWords))
  const api = $derived(connect({ ticks, groups, label, size, locale }, svelteNormalizer, { words }))
</script>

<div {...rest} {...api.rootProps}>
  <div {...api.stripProps}>
    {#if api.grouped}
      {#each api.groups as group (group.key)}<span {...group.groupProps}
          >{#each group.ticks as tick (tick.key)}<span {...tick.tickProps}></span>{/each}</span
        >{/each}
    {:else}
      {#each api.groups[0].ticks as tick (tick.key)}<span {...tick.tickProps}></span>{/each}
    {/if}
  </div>
  {#if api.axis}
    <div {...api.axisProps}>
      {#each api.axisCells as cell (cell.key)}<span {...cell.cellProps}>{cell.label}</span>{/each}
    </div>
  {/if}
</div>
