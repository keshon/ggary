<script lang="ts">
  import { Cluster, ClusterSpacer, Container, Grid, Stack } from '../../../packages/svelte/src/index'
  import type { FlowProps } from '../harness'

  let { kind, items, spacerAfter, ...options }: FlowProps = $props()
  const Component = $derived({ stack: Stack, cluster: Cluster, grid: Grid, container: Container }[kind] as any)
</script>

<Component {...options}>
  {#each items as item, i (item)}
    <p>{item}</p>
    {#if spacerAfter === i + 1}<ClusterSpacer />{/if}
  {/each}
</Component>
