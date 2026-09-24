<script lang="ts">
  import { getConfig } from '../config-provider/context'
  import { connect, type ButtonProps } from '@ggary/core/button'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'

  type Props = ButtonProps & {
    children?: Snippet
    onclick?: (event: MouseEvent) => void
    [key: string]: unknown
  }

  let {
    emphasis = 'medium',
    destructive = false,
    size: ownSize,
    disabled = false,
    loading = false,
    fullWidth = false,
    type = 'button',
    children,
    ...rest
  }: Props = $props()
  const kit = getConfig()
  // The default comes after the provider's, so a provider can set it.
  const size = $derived(ownSize ?? kit().size ?? 'md')

  // Same `connect()` React uses; only the normalizer differs.
  const api = $derived(connect({ emphasis, destructive, size, disabled, loading, fullWidth, type }, svelteNormalizer))
</script>

<button {...api.rootProps} {...rest}>
  {#if loading}<span {...api.spinnerProps}></span>{/if}
  {@render children?.()}
</button>
