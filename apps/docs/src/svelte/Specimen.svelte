<script lang="ts">
  import type { Snippet } from 'svelte'

  /** One specimen: the component on a stage, and the prop that made it. `wide` takes the whole row. */
  let { label, wide = false, children }: { label: string; wide?: boolean; children: Snippet } = $props()
</script>

<figure class="specimen" data-wide={wide ? '' : undefined}>
  <div class="specimen-stage">{@render children()}</div>
  <figcaption class="specimen-label">{label}</figcaption>
</figure>
