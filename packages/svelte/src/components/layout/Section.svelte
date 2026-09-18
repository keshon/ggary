<script lang="ts">
  import { connect } from '@ggary/core/section'
  import { svelteNormalizer, uid, type HeadingLevel, type RegionRank } from '@ggary/core'
  import type { Snippet } from 'svelte'

  type Props = {
    title?: string
    description?: string
    /** Default 2. */
    headingLevel?: HeadingLevel
    rank?: RegionRank
    /** A landmark, named by the title. */
    region?: boolean
    actions?: Snippet
    children?: Snippet
  }

  /** A stretch of the page under its heading, with no box around it. */
  let { title, description, headingLevel, rank, region, actions, children }: Props = $props()
  const id = uid('gg-section')
  const api = $derived(connect({ id, title, description, headingLevel, rank, region }, svelteNormalizer))
</script>

<section {...api.rootProps}>
  {#if title || actions || description}
    <div {...api.headerProps}>
      {#if title}<svelte:element this={api.titleElement} {...api.titleProps}>{title}</svelte:element>{/if}
      {#if actions}<div {...api.actionsProps}>{@render actions()}</div>{/if}
      {#if description}<p {...api.descriptionProps}>{description}</p>{/if}
    </div>
  {/if}
  <div {...api.bodyProps}>{@render children?.()}</div>
</section>
