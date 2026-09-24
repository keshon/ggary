<script lang="ts">
  import { getConfig } from '../config-provider/context'
  import { connect, type ChipProps } from '@ggary/core/chip'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'

  type Props = ChipProps & {
    children?: Snippet
    onRemove?: () => void
    [key: string]: unknown
  }

  let {
    emphasis = 'low',
    size: ownSize,
    selected = false,
    disabled = false,
    removable,
    interactive = false,
    children,
    onRemove,
    ...rest
  }: Props = $props()
  const kit = getConfig()
  // The default comes after the provider's, so a provider can set it.
  const size = $derived(ownSize ?? kit().size ?? 'md')

  const showRemove = $derived(removable ?? !!onRemove)
  const api = $derived(
    connect({ emphasis, size, selected, disabled, removable: showRemove, interactive }, svelteNormalizer, { onRemove })
  )
</script>

{#snippet body()}
  <span {...api.labelProps}>{@render children?.()}</span>
  {#if showRemove}
    <span {...api.removeProps}><span {...api.removeIconProps}></span></span>
  {/if}
{/snippet}

{#if interactive}
  <button {...api.rootProps} {...rest}>{@render body()}</button>
{:else}
  <span {...api.rootProps} {...rest}>{@render body()}</span>
{/if}
