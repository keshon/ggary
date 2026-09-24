<script lang="ts">
  import { Flex, FlexItem } from '../../../packages/svelte/src/index'

  let { items, ...options }: any = $props()
</script>

<Flex {...options}>
  {#each items as item (item.text)}
    {#if item.grow !== undefined || item.shrink !== undefined || item.align !== undefined}
      <FlexItem grow={item.grow} shrink={item.shrink} align={item.align}><p>{item.text}</p></FlexItem>
    {:else}
      <p>{item.text}</p>
    {/if}
  {/each}
</Flex>
