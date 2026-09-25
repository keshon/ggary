<script lang="ts">
  import { getConfig } from '../config-provider/context'
  import { connect, type ButtonGroupProps } from '@ggary/core/button-group'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'

  let { size: ownSize, label, children, ...rest }: ButtonGroupProps & { children: Snippet; [key: string]: unknown } = $props()
  const kit = getConfig()
  const size = $derived(ownSize ?? kit().size)

  const api = $derived(connect({ size, label }, svelteNormalizer))
</script>

<div {...rest} {...api.rootProps}>{@render children()}</div>
