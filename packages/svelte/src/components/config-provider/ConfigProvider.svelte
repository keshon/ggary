<script lang="ts">
  import type { Snippet } from 'svelte'
  import { connect, resolveConfig, type KitConfig } from '@ggary/core/config-provider'
  import { svelteNormalizer } from '@ggary/core'
  import { getConfig, provideConfig } from './context'

  type Props = KitConfig & { children?: Snippet }

  /**
   * Settings for everything under it: the locale dates, times and numbers are
   * written in, the direction, the controls' size, a light or dark island, and
   * the kit's words. A component's own prop always wins; a provider inside
   * another changes only what it sets.
   */
  let { locale, dir, size, mode, words, children }: Props = $props()

  const outer = getConfig()
  const config = $derived(resolveConfig(outer(), { locale, dir, size, mode, words }))
  provideConfig(() => config)
  // The element says only what this provider sets: the rest is already said above it, and inherited.
  const api = $derived(connect({ locale, dir, mode }, svelteNormalizer))
</script>

<div {...api.rootProps}>{@render children?.()}</div>
