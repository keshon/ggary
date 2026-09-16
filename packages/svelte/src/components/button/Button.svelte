<script lang="ts">
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
    tone = 'neutral',
    size = 'md',
    disabled = false,
    loading = false,
    fullWidth = false,
    type = 'button',
    children,
    ...rest
  }: Props = $props()

  // Same `connect()` React uses; only the normalizer differs.
  const api = $derived(connect({ emphasis, tone, size, disabled, loading, fullWidth, type }, svelteNormalizer))
</script>

<button {...api.rootProps} {...rest}>
  {#if loading}<span {...api.spinnerProps}></span>{/if}
  {@render children?.()}
</button>
