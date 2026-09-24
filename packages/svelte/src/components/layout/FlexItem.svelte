<script lang="ts">
  import { connectFlexItem, type FlexItemProps } from '@ggary/core/flow'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'

  let { grow, shrink, align, children, ...rest }: FlexItemProps & { children?: Snippet; [key: string]: unknown } = $props()
  const api = $derived(connectFlexItem({ grow, shrink, align }, svelteNormalizer))
</script>

<div {...rest} {...api.rootProps}>{@render children?.()}</div>
