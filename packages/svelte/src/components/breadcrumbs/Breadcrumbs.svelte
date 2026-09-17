<script lang="ts">
  import { connect, type BreadcrumbsProps } from '@ggary/core/breadcrumbs'
  import { svelteNormalizer } from '@ggary/core'

  let { items, label, ...rest }: BreadcrumbsProps & { [key: string]: unknown } = $props()

  const api = $derived(connect({ items, label }, svelteNormalizer))
</script>

<nav {...rest} {...api.rootProps}>
  <ol {...api.listProps}>
    {#each items as item, index (item.label + index)}
      {@const parts = api.getItemProps(item, index)}
      <li {...parts.itemProps}>
        <svelte:element this={parts.element} {...parts.linkProps}>{item.label}</svelte:element>
      </li>
    {/each}
  </ol>
</nav>
