<script lang="ts">
  import { connect, type ResultProps } from '@ggary/core/result'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'

  let { tone, title, description, code, headingLevel, live, actions, children }: ResultProps & { actions?: Snippet; children?: Snippet } = $props()
  const api = $derived(connect({ tone, title, description, code, headingLevel, live }, svelteNormalizer))
</script>

<div {...api.rootProps}>
  {#if api.showCode}<span {...api.codeProps}>{code}</span>{:else}<span {...api.iconProps}></span>{/if}
  <svelte:element this={api.titleElement} {...api.titleProps}>{title}</svelte:element>
  {#if description !== undefined}<p {...api.descriptionProps}>{description}</p>{/if}
  {#if actions}<div {...api.actionsProps}>{@render actions()}</div>{/if}
  {#if children}<div {...api.detailsProps}>{@render children()}</div>{/if}
</div>
