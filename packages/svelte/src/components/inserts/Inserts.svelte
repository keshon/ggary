<script lang="ts">
  import { connect, type InsertsProps } from '@ggary/core/inserts'
  import { svelteNormalizer } from '@ggary/core'

  type Props = InsertsProps & { [key: string]: unknown }

  let { items, target, onInsert, label, ...rest }: Props = $props()

  const api = $derived(connect({ items, target, onInsert, label }, svelteNormalizer))
</script>

<div {...api.rootProps} {...rest}>
  {#each api.items as item (item.value)}
    <button {...api.itemProps(item)}>{api.itemLabel(item)}</button>
  {/each}
</div>
