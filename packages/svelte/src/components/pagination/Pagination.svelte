<script lang="ts">
  import type { ControlSize } from '@ggary/core'
  import { connect, type PaginationProps } from '@ggary/core/pagination'
  import { svelteNormalizer } from '@ggary/core'

  let {
    items, label, onPageChange, size, ...rest
  }: PaginationProps & { onPageChange?: (page: number, event: Event) => void; size?: ControlSize; [key: string]: unknown } = $props()

  const api = $derived(connect({ items, label }, svelteNormalizer, { onPageChange, size }))
</script>

<nav {...rest} {...api.rootProps}>
  <ol {...api.listProps}>
    {#each items as item, index (item.label + index)}
      {@const parts = api.getItemProps(item)}
      <li {...parts.itemProps}>
        <svelte:element this={parts.element} {...parts.linkProps}>{item.label}</svelte:element>
      </li>
    {/each}
  </ol>
</nav>
