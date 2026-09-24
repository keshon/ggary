<script lang="ts">
  import { getConfig } from '../config-provider/context'
  import { configWords } from '@ggary/core/config-provider'
  import { connect, type LegendProps, type LegendWords } from '@ggary/core/legend'
  import { svelteNormalizer } from '@ggary/core'

  /* words: the default name of the list in another language. */
  type Props = LegendProps & {
    words?: Partial<LegendWords>
    [key: string]: unknown
  }

  let { items, direction, label, words: ownWords, ...rest }: Props = $props()
  const kit = getConfig()
  const words = $derived(configWords(kit(), 'legend', ownWords))
  const api = $derived(connect({ items, direction, label }, svelteNormalizer, { words }))
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
