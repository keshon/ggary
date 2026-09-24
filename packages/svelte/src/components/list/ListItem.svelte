<script lang="ts">
  import type { Snippet } from 'svelte'
  import { connectListItem, type ListItemProps } from '@ggary/core/list'
  import { svelteNormalizer, uid } from '@ggary/core'

  type Props = ListItemProps & {
    /** At the start: an Avatar, an icon. */
    leading?: Snippet
    /** At the end, what is known about it: a Badge, a time. */
    meta?: Snippet
    /** Its own buttons — a Menu's trigger — which stay targets of their own over a row that is one. */
    actions?: Snippet
  }

  /** A row of a List. Given `href` or `onSelect`, the whole row is its title's link or button. */
  let { title, description, href, onSelect, current, disabled, leading, meta, actions }: Props = $props()

  const id = uid('gg-list-item')
  const api = $derived(connectListItem({ id, title, description, href, onSelect, current, disabled }, svelteNormalizer))
</script>

<li {...api.itemProps}>
  {#if leading}<div {...api.leadingProps}>{@render leading()}</div>{/if}
  <div {...api.bodyProps}>
    {#if api.kind === 'link'}
      <a {...api.targetProps}>{title}</a>
    {:else if api.kind === 'button'}
      <button {...api.targetProps}>{title}</button>
    {:else}
      <span {...api.itemTitleProps}>{title}</span>
    {/if}
    {#if description}<span {...api.descriptionProps}>{description}</span>{/if}
  </div>
  {#if meta}<div {...api.metaProps}>{@render meta()}</div>{/if}
  {#if actions}<div {...api.actionsProps}>{@render actions()}</div>{/if}
</li>
