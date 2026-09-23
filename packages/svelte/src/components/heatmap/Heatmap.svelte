<script lang="ts">
  import { connect, type HeatmapProps, type HeatmapWords } from '@ggary/core/heatmap'
  import { svelteNormalizer } from '@ggary/core'

  type Props = HeatmapProps & {
    /** The fixed text of the field's name and of a cell's title. */
    words?: HeatmapWords
    [key: string]: unknown
  }

  let { days, weekStart, label, unit, locale, words, ...rest }: Props = $props()
  const api = $derived(connect({ days, weekStart, label, unit, locale }, svelteNormalizer, words))
</script>

<div {...rest} {...api.rootProps}>
  {#each api.weeks as week (week.key)}
    <div {...week.weekProps}>
      {#if week.monthLabel}<span {...week.monthLabelProps}>{week.monthLabel}</span>{/if}
      {#each week.days as day (day.key)}<span {...day.dayProps}></span>{/each}
    </div>
  {/each}
</div>
