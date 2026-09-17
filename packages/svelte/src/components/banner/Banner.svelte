<script lang="ts">
  import { connect, type BannerProps } from '@ggary/core/banner'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'

  type Props = BannerProps & {
    /** The detail under the title. */
    children?: Snippet
    /** One or two actions at the far edge. */
    actions?: Snippet
    /** Shows a close button. Remove the banner when it is called. */
    onDismiss?: () => void
  }

  let { tone, title, live, dismissible, dismissLabel, children, actions, onDismiss }: Props = $props()
  const api = $derived(connect({ tone, title, live, dismissible: dismissible ?? !!onDismiss, dismissLabel }, svelteNormalizer, onDismiss))
</script>

<div {...api.rootProps}>
  {#if api.showIcon}
    <span {...api.iconProps}></span>
  {/if}
  <div {...api.bodyProps}>
    {#if title !== undefined}
      <p {...api.titleProps}>{title}</p>
    {/if}
    {#if children}
      <div {...api.textProps}>{@render children()}</div>
    {/if}
  </div>
  {#if actions}
    <div {...api.actionsProps}>{@render actions()}</div>
  {/if}
  {#if api.showClose}
    <button {...api.closeProps}><span {...api.closeIconProps}></span></button>
  {/if}
</div>
