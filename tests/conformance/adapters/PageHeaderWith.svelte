<script lang="ts">
  import { PageHeader } from '../../../packages/svelte/src/index'
  import type { PageHeaderProps } from '../harness'

  let { title, description, headingLevel, context, actions }: PageHeaderProps = $props()
</script>

{#snippet contextSnippet()}<p>{context}</p>{/snippet}
{#snippet actionsSnippet()}{#each actions ?? [] as label (label)}<button type="button">{label}</button>{/each}{/snippet}

<PageHeader {title} {description} {headingLevel} context={context ? contextSnippet : undefined} actions={actions ? actionsSnippet : undefined} />
