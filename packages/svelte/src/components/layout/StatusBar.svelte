<script lang="ts">
  import { connect } from '@ggary/core/status-bar'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'

  /** One line of readings along the bottom of a tool. */
  let { label, children, ...rest }: { label?: string; children: Snippet; [key: string]: unknown } = $props()
  const api = $derived(connect({ label }, svelteNormalizer))
</script>

<div {...rest} {...api.rootProps}>{@render children()}</div>
