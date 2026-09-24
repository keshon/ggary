<script lang="ts">
  import { getConfig } from '../config-provider/context'
  import { configWords } from '@ggary/core/config-provider'
  import { connect, type LinkProps, type LinkWords } from '@ggary/core/link'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'

  let { external, words: ownWords, children, ...rest }: LinkProps & { words?: LinkWords; children?: Snippet; [key: string]: unknown } = $props()
  const kit = getConfig()
  const words = $derived(configWords(kit(), 'link', ownWords))
  const api = $derived(connect({ external }, svelteNormalizer, { words }))
</script>

<!-- One line: whitespace before the glyph would be drawn as a gap and underlined. -->
<a {...rest} {...api.rootProps}>{@render children?.()}{#if api.external}<span {...api.iconProps}></span><span {...api.hintProps}>{api.hintText}</span>{/if}</a>
