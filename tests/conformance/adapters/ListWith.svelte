<script lang="ts">
  import { List, ListItem } from '../../../packages/svelte/src/index'

  let { items, onSelect, onAction, ...options }: any = $props()
</script>

<List {...options}>
  {#each items as item (item.title)}
    {#snippet meta()}<span>{item.meta}</span>{/snippet}
    {#snippet actions()}<button type="button" onclick={() => onAction?.(item.title)}>{item.action}</button>{/snippet}
    <ListItem
      title={item.title}
      description={item.description}
      href={item.href}
      onSelect={item.press ? () => onSelect?.(item.title) : undefined}
      current={item.current}
      disabled={item.disabled}
      meta={item.meta ? meta : undefined}
      actions={item.action ? actions : undefined}
    />
  {/each}
</List>
