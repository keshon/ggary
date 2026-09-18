<script lang="ts">
  import { connectCluster, type ClusterProps } from '@ggary/core/flow'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'

  /** A row that wraps. */
  let { gap, justify, children, ...rest }: ClusterProps & { children?: Snippet; [key: string]: unknown } = $props()
  const api = $derived(connectCluster({ gap, justify }, svelteNormalizer))
</script>

<div {...rest} {...api.rootProps}>{@render children?.()}</div>
