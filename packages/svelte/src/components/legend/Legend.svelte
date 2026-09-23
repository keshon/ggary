<script lang="ts">
  import { connect, type LegendProps, type LegendWords } from '@ggary/core/legend'
  import { svelteNormalizer } from '@ggary/core'

  /* words: the default name of the list in another language. */
  type Props = LegendProps & {
    words?: Partial<LegendWords>
    [key: string]: unknown
  }

  let { items, direction, label, words, ...rest }: Props = $props()
  const api = $derived(connect({ items, direction, label }, svelteNormalizer, words))
</script>

<ul {...api.rootProps} {...rest}>
  <!-- Two series may share a label, so the position keys the item. -->
  {#each api.items as item, index (index)}
    {@const entry = api.getItemProps(item)}
    <li {...entry.itemProps}>
      <span {...entry.swatchProps}></span>
      <span {...entry.labelProps}>{item.label}</span>
      {#if entry.showValue}<span {...entry.valueProps}>{item.value}</span>{/if}
    </li>
  {/each}
</ul>
