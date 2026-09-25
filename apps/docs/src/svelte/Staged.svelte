<script lang="ts">
  import type { Snippet } from 'svelte'
  import { stageDrop } from '../data/upload'

  /** A page's states on show as it loads: once the Upload inside is there, a drop of `files` is staged on it. */
  let { files, children }: { files: () => File[] | Promise<File[]>; children: Snippet } = $props()
  let host = $state<HTMLDivElement | null>(null)
  $effect(() => {
    const element = host
    if (element) requestAnimationFrame(async () => stageDrop(element, await files()))
  })
</script>

<div bind:this={host}>{@render children()}</div>
