<script lang="ts">
  import { connect, type TextProps } from '@ggary/core/text'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'

  let { tone, emphasis, strong, code, kbd, mark, deleted, truncate, children, ...rest }: TextProps & { children?: Snippet; [key: string]: unknown } = $props()
  const api = $derived(connect({ tone, emphasis, strong, code, kbd, mark, deleted, truncate }, svelteNormalizer))
</script>

<svelte:element this={api.element} {...rest} {...api.rootProps}>{@render children?.()}</svelte:element>
