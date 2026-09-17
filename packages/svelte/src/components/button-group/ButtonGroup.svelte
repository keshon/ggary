<script lang="ts">
  import { connect, type ButtonGroupProps } from '@ggary/core/button-group'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'

  let { size, label, children }: ButtonGroupProps & { children: Snippet } = $props()

  const api = $derived(connect({ size, label }, svelteNormalizer))
</script>

<div {...api.rootProps}>{@render children()}</div>
