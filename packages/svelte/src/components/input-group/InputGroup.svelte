<script lang="ts">
  import { connect, type InputGroupProps } from '@ggary/core/input-group'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'

  let { prefix, suffix, size, disabled, invalid, children }: InputGroupProps & { children: Snippet } = $props()

  const api = $derived(connect({ prefix, suffix, size, disabled, invalid }, svelteNormalizer))
</script>

<div {...api.rootProps}>
  {#if api.showPrefix}
    <span {...api.prefixProps}>{api.prefix}</span>
  {/if}
  {@render children()}
  {#if api.showSuffix}
    <span {...api.suffixProps}>{api.suffix}</span>
  {/if}
</div>
