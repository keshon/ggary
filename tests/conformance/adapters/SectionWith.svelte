<script lang="ts">
  import { Section } from '../../../packages/svelte/src/index'
  import type { SectionProps } from '../harness'

  let { title, description, headingLevel, rank, region, actions, body }: SectionProps = $props()
</script>

{#snippet actionsSnippet()}{#each actions ?? [] as label (label)}<button type="button">{label}</button>{/each}{/snippet}

<Section {title} {description} {headingLevel} {rank} {region} actions={actions ? actionsSnippet : undefined}>
  <p>{body}</p>
</Section>
