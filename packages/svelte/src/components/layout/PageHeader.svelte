<script lang="ts">
  import { connect } from '@ggary/core/page-header'
  import { svelteNormalizer, uid, type HeadingLevel } from '@ggary/core'
  import type { Snippet } from 'svelte'

  type Props = {
    title: string
    description?: string
    /** Default 1. */
    headingLevel?: HeadingLevel
    /** Above the title: breadcrumbs, a back link. */
    context?: Snippet
    /** At the far edge: the screen's own actions. */
    actions?: Snippet
  }

  /** The top of a screen: where you are, what this is, what can be done with it. */
  let { title, description, headingLevel, context, actions, ...rest }: Props & { [key: string]: unknown } = $props()
  const id = uid('gg-page')
  const api = $derived(connect({ id, title, description, headingLevel }, svelteNormalizer))
</script>

<div {...rest} {...api.rootProps}>
  {#if context}<div {...api.contextProps}>{@render context()}</div>{/if}
  <div {...api.mainProps}>
    <svelte:element this={api.titleElement} {...api.titleProps}>{title}</svelte:element>
    {#if description}<p {...api.descriptionProps}>{description}</p>{/if}
  </div>
  {#if actions}<div {...api.actionsProps}>{@render actions()}</div>{/if}
</div>
