<script lang="ts">
  import { connectFlex, type FlexProps } from '@ggary/core/flow'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'

  let { direction, gap, align, justify, wrap, children, ...rest }: FlexProps & { children?: Snippet; [key: string]: unknown } = $props()
  const api = $derived(connectFlex({ direction, gap, align, justify, wrap }, svelteNormalizer))
</script>

<div {...rest} {...api.rootProps}>{@render children?.()}</div>
