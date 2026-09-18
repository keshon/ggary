<script lang="ts">
  import { connect, type RailItem } from '@ggary/core/rail'
  import { svelteNormalizer, uid } from '@ggary/core'

  type Props = {
    /** The landmark's name, required. */
    label: string
    items: RailItem[]
  }

  let { label, items }: Props = $props()
  const id = uid('gg-rail')
  const api = $derived(connect({ id, label, items }, svelteNormalizer))
</script>

{#snippet link(item: RailItem)}
  {@const parts = api.getItemProps(item)}
  <a {...parts.itemProps}>
    <span {...parts.iconProps}></span>
    <span {...parts.labelProps}>{item.label}</span>
    {#if parts.showCount}<span {...parts.countProps}>{item.count}</span>{/if}
  </a>
{/snippet}

<nav {...api.rootProps}>
  {#each api.start as item (item.href)}{@render link(item)}{/each}
  {#if api.end.length > 0}<span {...api.spacerProps}></span>{/if}
  {#each api.end as item (item.href)}{@render link(item)}{/each}
</nav>
