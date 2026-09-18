<script lang="ts">
  import { connectStack, type FlowGap } from '@ggary/core/flow'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'

  /** A column; what is sized by its content keeps its width. */
  let { gap, children, ...rest }: { gap?: FlowGap; children?: Snippet; [key: string]: unknown } = $props()
  const api = $derived(connectStack({ gap }, svelteNormalizer))
</script>

<div {...rest} {...api.rootProps}>{@render children?.()}</div>
