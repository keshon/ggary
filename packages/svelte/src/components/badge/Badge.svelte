<script lang="ts">
  import { connect, type BadgeProps } from '@ggary/core/badge'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'

  type Props = BadgeProps & {
    /** The word. A state is always named, never only coloured. */
    children?: Snippet
    [key: string]: unknown
  }

  let { tone, variant, dot, children, ...rest }: Props = $props()
  const api = $derived(connect({ tone, variant, dot }, svelteNormalizer))
</script>

<span {...api.rootProps} {...rest}>{#if api.showDot}<span {...api.dotProps}></span>{/if}{@render children?.()}</span>
