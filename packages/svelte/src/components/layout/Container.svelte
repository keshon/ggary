<script lang="ts">
  import { connectContainer, type ContainerProps } from '@ggary/core/flow'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'

  /** The width a screen's content keeps, centred. */
  let { size, children, ...rest }: ContainerProps & { children?: Snippet; [key: string]: unknown } = $props()
  const api = $derived(connectContainer({ size }, svelteNormalizer))
</script>

<div {...rest} {...api.rootProps}>{@render children?.()}</div>
