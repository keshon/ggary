<script lang="ts">
  import { getConfig } from '../config-provider/context'
  import { configWords } from '@ggary/core/config-provider'
  import type { Snippet } from 'svelte'
  import { tick } from 'svelte'
  import { connectList, focusListItem, type ListMoreState, type ListProps, type ListWords } from '@ggary/core/list'
  import { svelteNormalizer, uid } from '@ggary/core'

  type Props = ListProps & {
    /** The rows: ListItems. */
    children?: Snippet
    /** Under the rows, before "Show more": a Pagination, a link to all of them. */
    footer?: Snippet
    /**
     * Loads the next rows. A promise keeps "Show more" busy until it settles; a
     * rejection says it failed and offers to try again. Once it is done, the
     * focus goes to the first row that came.
     */
    onLoadMore?: () => unknown
    /** There are more to load. Default: true while there is an `onLoadMore`. */
    hasMore?: boolean
    words?: ListWords
  }

  /** A list of things, each a row with what it is, what is known about it, and what can be done with it. */
  let { variant, label, count, ariaLabel, children, footer, onLoadMore, hasMore, words: ownWords }: Props = $props()
  const kit = getConfig()
  const words = $derived(configWords(kit(), 'list', ownWords))

  const id = uid('gg-list')
  let more = $state<ListMoreState>('idle')
  let items = $state<HTMLUListElement | null>(null)

  const rows = () => items?.querySelectorAll(":scope > [data-scope='list'][data-part='item']").length ?? 0

  async function loadMore() {
    const before = rows()
    more = 'loading'
    try {
      await onLoadMore?.()
    } catch {
      more = 'failed'
      return
    }
    more = 'idle'
    await tick()
    // Only when the focus was on "Show more", or fell to the page with it gone: a reader elsewhere is left alone.
    const active = document.activeElement
    const followed = !active || active === document.body || active.closest("[data-scope='list'][data-part='footer']") !== null
    if (followed && rows() > before) focusListItem(items, before)
  }

  const api = $derived(
    connectList({ id, variant, label, count, ariaLabel }, svelteNormalizer, {
      hasMore: hasMore ?? onLoadMore !== undefined,
      more,
      onLoadMore: loadMore,
      words,
    })
  )
</script>

<div {...api.rootProps}>
  {#if api.showHeader}
    <div {...api.headerProps}>
      {#if label}<div {...api.titleProps}>{label}</div>{/if}
      {#if count}<span {...api.countProps}>{count}</span>{/if}
    </div>
  {/if}
  <ul bind:this={items} {...api.itemsProps}>
    {@render children?.()}
  </ul>
  {#if footer || api.showMore}
    <div {...api.footerProps}>
      {@render footer?.()}
      {#if api.showMore}
        <button {...api.moreProps}>{api.moreText}</button>
        <span {...api.moreErrorProps}>{api.failed ? api.moreErrorText : ''}</span>
      {/if}
    </div>
  {/if}
</div>
