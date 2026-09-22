<script lang="ts">
  import { connect, type TimelineItem, type TimelineProps } from '@ggary/core/timeline'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'

  type Props = TimelineProps & {
    /**
     * A rich body in place of the title and detail. The dot and the time stay
     * the Timeline's; the tone still has to be said in words in what this draws.
     */
    item?: Snippet<[TimelineItem]>
    [key: string]: unknown
  }

  let { items, label, locale, timeFormat, item: body, ...rest }: Props = $props()

  const api = $derived(connect({ items, label, locale, timeFormat }, svelteNormalizer))
</script>

<ol {...rest} {...api.rootProps}>
  {#each items as entry (entry.id)}
    {@const parts = api.getItemProps(entry)}
    <li {...parts.itemProps}>
      <span {...parts.dotProps}></span>
      <div {...parts.bodyProps}>{#if body}{@render body(entry)}{:else}{entry.title}{#if parts.showDetail}<div {...parts.detailProps}>{entry.detail}</div>{/if}{/if}</div>
      {#if parts.showTime}<time {...parts.timeProps}>{parts.timeLabel}</time>{/if}
    </li>
  {/each}
</ol>
