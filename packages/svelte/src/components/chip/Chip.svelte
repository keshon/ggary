<script lang="ts">
  import { connect, type ChipProps } from '@ggary/core/chip'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'
  import RemoveIcon from './RemoveIcon.svelte'

  type Props = ChipProps & {
    children?: Snippet
    onRemove?: () => void
    [key: string]: unknown
  }

  let {
    emphasis = 'low',
    size = 'md',
    selected = false,
    disabled = false,
    removable,
    interactive = false,
    children,
    onRemove,
    ...rest
  }: Props = $props()

  const showRemove = $derived(removable ?? !!onRemove)
  const api = $derived(
    connect({ emphasis, size, selected, disabled, removable: showRemove, interactive }, svelteNormalizer, onRemove)
  )
</script>

{#snippet body()}
  <span {...api.labelProps}>{@render children?.()}</span>
  {#if showRemove}
    <span {...api.removeProps}><RemoveIcon /></span>
  {/if}
{/snippet}

{#if interactive}
  <button {...api.rootProps} {...rest}>{@render body()}</button>
{:else}
  <span {...api.rootProps} {...rest}>{@render body()}</span>
{/if}
