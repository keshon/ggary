<script lang="ts">
  import { connect, type ProseProps } from '@ggary/core/prose'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'

  /** Children, or authored HTML through `html` — a markdown renderer's output, trusted by whoever passes it. */
  let { size, html, children, ...rest }: ProseProps & { html?: string; children?: Snippet; [key: string]: unknown } = $props()
  const api = $derived(connect({ size }, svelteNormalizer))
</script>

<div {...rest} {...api.rootProps}>
  {#if html !== undefined}{@html html}{:else}{@render children?.()}{/if}
</div>
