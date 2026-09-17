<script lang="ts">
  import { connect, type PaginationProps } from '@ggary/core/pagination'
  import { svelteNormalizer } from '@ggary/core'

  let {
    items, label, onPageChange, ...rest
  }: PaginationProps & { onPageChange?: (page: number, event: Event) => void; [key: string]: unknown } = $props()

  const api = $derived(connect({ items, label }, svelteNormalizer, { onPageChange }))
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
