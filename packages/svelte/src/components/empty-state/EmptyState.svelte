<script lang="ts">
  import { connect, type EmptyStateProps } from '@ggary/core/empty-state'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'

  /* children: the next step, usually one button. */
  let { title, description, headingLevel, live, children }: EmptyStateProps & { children?: Snippet } = $props()
  const api = $derived(connect({ title, description, headingLevel, live }, svelteNormalizer))
</script>

<div {...api.rootProps}>
  <svelte:element this={api.titleElement} {...api.titleProps}>{title}</svelte:element>
  {#if description !== undefined}
    <p {...api.descriptionProps}>{description}</p>
  {/if}
  {#if children}
    <div {...api.actionsProps}>{@render children()}</div>
  {/if}
</div>
