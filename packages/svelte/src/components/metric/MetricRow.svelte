<script lang="ts">
  import { connectRow, type MetricRowProps } from '@ggary/core/metric'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'

  /* children: the metrics. */
  let { joined, headline, children }: MetricRowProps & { children?: Snippet } = $props()
  const api = $derived(connectRow({ joined, headline }, svelteNormalizer))
</script>

<div {...api.rootProps}>{@render children?.()}</div>
