<script lang="ts">
  import { ToolbarButton, Toolbar, ToolbarSeparator, ToolbarSpacer } from '../../../packages/svelte/src/index'

  let { tools, ...rest }: { tools?: string[]; [key: string]: unknown } = $props()
</script>

<Toolbar {...rest}>
  {#each tools ?? ['Move', 'Rotate', 'Scale'] as label, index (index)}
    {#if label === '|'}
      <ToolbarSeparator />
    {:else if label === '>'}
      <ToolbarSpacer />
    {:else}
      <ToolbarButton size="sm">{label}</ToolbarButton>
    {/if}
  {/each}
</Toolbar>
