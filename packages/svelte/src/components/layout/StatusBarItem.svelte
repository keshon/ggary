<script lang="ts">
  import { connect } from '@ggary/core/status-bar'
  import { svelteNormalizer, type StatusTone } from '@ggary/core'
  import type { Snippet } from 'svelte'

  /** A reading. One that can be pressed is a small low Button instead. */
  let { tone, children }: { tone?: StatusTone; children: Snippet } = $props()
  const api = $derived(connect({}, svelteNormalizer))
</script>

<span {...api.getItemProps(tone)}>{@render children()}</span>
