<script lang="ts">
  import { connect, type NoteProps } from '@ggary/core/note'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'

  let { tone, live, children }: NoteProps & { children?: Snippet } = $props()
  const api = $derived(connect({ tone, live }, svelteNormalizer))
</script>

<div {...api.rootProps}>
  {#if api.showIcon}
    <span {...api.iconProps}></span>
  {/if}
  <div {...api.bodyProps}>{@render children?.()}</div>
</div>
