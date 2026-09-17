<script lang="ts">
  import { connect, type PanelProps } from '@ggary/core/panel'
  import { svelteNormalizer, uid } from '@ggary/core'
  import type { Snippet } from 'svelte'

  type Props = PanelProps & {
    /** Controls in the header, at its far edge. */
    actions?: Snippet
    children?: Snippet
    [key: string]: unknown
  }

  let { title, headingLevel, body, plain, rank, tone, region, scrollable, actions, children, ...rest }: Props = $props()
  const id = uid('gg-panel')
  const api = $derived(connect({ id, title, headingLevel, body, plain, rank, tone, region, scrollable }, svelteNormalizer))
</script>

<div {...api.rootProps} {...rest}>
  {#if title !== undefined || actions}
    <div {...api.headerProps}>
      {#if title !== undefined}
        <svelte:element this={api.titleElement} {...api.titleProps}>{title}</svelte:element>
      {/if}
      {#if actions}
        <div {...api.actionsProps}>{@render actions()}</div>
      {/if}
    </div>
  {/if}
  <div {...api.bodyProps}>{@render children?.()}</div>
</div>
