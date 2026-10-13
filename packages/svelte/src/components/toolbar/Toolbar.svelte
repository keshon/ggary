<script lang="ts">
  import { connect, type ToolbarProps } from '@ggary/core/toolbar'
  import { Toolbar as Primitive } from 'bits-ui'
  import { provideToolbar } from './context'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'

  let {
    label, orientation = 'horizontal', children, ...rest
  }: ToolbarProps & { children: Snippet; [key: string]: unknown } = $props()

  const api = $derived(connect({ label, orientation }, svelteNormalizer))
  provideToolbar(() => api.managed)
</script>

{#if api.managed}
  <Primitive.Root {...rest} {...api.rootProps} {orientation} data-backend="bits-ui">{@render children()}</Primitive.Root>
{:else}
  <div {...rest} {...api.rootProps}>{@render children()}</div>
{/if}
