<script lang="ts">
  import { StatusBar, StatusBarItem, StatusBarSpacer } from '../../../packages/svelte/src/index'
  import type { StatusBarProps } from '../harness'

  let { label, items, end }: StatusBarProps = $props()
</script>

<StatusBar {label}>
  {#each items as item, i (i)}<StatusBarItem tone={item.tone}>{item.text}</StatusBarItem>{/each}
  {#if end}
    <StatusBarSpacer />
    {#each end as item, i (i)}<StatusBarItem>{item.text}</StatusBarItem>{/each}
  {/if}
</StatusBar>
