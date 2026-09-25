<script lang="ts">
  import type { Snippet } from 'svelte'
  import { SECTIONS, settlePage, type SectionKey } from '../site'

  /**
   * Every page, the same shape: the sections it has, in the one order, each a
   * grid of specimens. A page only says what goes in each section.
   */
  let props: Partial<Record<SectionKey, Snippet>> = $props()
  $effect(settlePage)
</script>

{#each SECTIONS.filter(({ key }) => props[key] !== undefined) as { key, title } (key)}
  <section class="section" aria-labelledby="section-{key}">
    <h2 class="section-title" id="section-{key}">{title}</h2>
    <div class="specimens">{@render props[key]?.()}</div>
  </section>
{/each}
