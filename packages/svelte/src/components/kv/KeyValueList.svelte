<script lang="ts" generics="T extends KeyValueItem<string>">
  import { connect, type KeyValueItem, type KeyValueListProps } from '@ggary/core/kv'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'

  type Props = KeyValueListProps & {
    /** The pairs, in reading order. */
    items: T[]
    /** A rich value — a badge, a link, a time — drawn from its item. Without it the value is text. */
    value?: Snippet<[T]>
  }

  let { items, tight, value }: Props = $props()
  const api = $derived(connect({ tight }, svelteNormalizer))
</script>

<dl {...api.rootProps}>
  {#each items as item, index (index)}
    <dt {...api.termProps}>{item.label}</dt>
    <dd {...api.detailProps}>{#if value}{@render value(item)}{:else}{item.value ?? ''}{/if}</dd>
  {/each}
</dl>
