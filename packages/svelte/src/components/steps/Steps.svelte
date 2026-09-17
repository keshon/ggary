<script lang="ts">
  import { connect, type StepsProps } from '@ggary/core/steps'
  import { svelteNormalizer } from '@ggary/core'

  let { items, label, ...rest }: StepsProps & { [key: string]: unknown } = $props()

  const api = $derived(connect({ items, label }, svelteNormalizer))
</script>

<ol {...rest} {...api.rootProps}>
  {#each items as item, index (item.name + index)}
    {@const parts = api.getItemProps(item)}
    <li {...parts.itemProps}>
      <span {...parts.nameProps}>{item.name}</span>
      <span {...parts.noteProps}>{parts.note}</span>
    </li>
  {/each}
</ol>
