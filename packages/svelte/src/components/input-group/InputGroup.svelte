<script lang="ts">
  import { getConfig } from '../config-provider/context'
  import { connect, type InputGroupProps } from '@ggary/core/input-group'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'

  let { prefix, suffix, size: ownSize, disabled, invalid, children, ...rest }: InputGroupProps & { children: Snippet; [key: string]: unknown } = $props()
  const kit = getConfig()
  const size = $derived(ownSize ?? kit().size)

  const api = $derived(connect({ prefix, suffix, size, disabled, invalid }, svelteNormalizer))
</script>

<div {...rest} {...api.rootProps}>
  {#if api.showPrefix}
    <span {...api.prefixProps}>{api.prefix}</span>
  {/if}
  {@render children()}
  {#if api.showSuffix}
    <span {...api.suffixProps}>{api.suffix}</span>
  {/if}
</div>
