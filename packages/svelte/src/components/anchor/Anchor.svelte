<script lang="ts">
  import { untrack } from 'svelte'
  import { getConfig } from '../config-provider/context'
  import { configWords } from '@ggary/core/config-provider'
  import { anchorFloatQuery, anchorHrefs, connect, type AnchorItem, type AnchorProps } from '@ggary/core/anchor'
  import { attachAnchorPanel, svelteNormalizer, uid, watchMedia, watchScrollSpy } from '@ggary/core'

  /**
   * On-page navigation: links to the page's sections, the one being read
   * marked as the page scrolls. With `float`, folded behind a button at the
   * window's corner that names where the reader is.
   */
  let {
    label,
    items,
    current,
    onCurrentChange,
    offset,
    float,
    open,
    defaultOpen = false,
    onOpenChange,
    words: ownWords,
    ...rest
  }: Omit<AnchorProps, 'id'> & { defaultOpen?: boolean; [key: string]: unknown } = $props()
  const kit = getConfig()
  const words = $derived(configWords(kit(), 'anchor', ownWords))

  const id = uid('gg-anchor')
  let read = $state<string | null>(untrack(() => items[0]?.href ?? null))
  let narrow = $state(false)
  let kept = $state(untrack(() => defaultOpen))
  const floating = $derived(float === true || (typeof float === 'number' && narrow))
  const shown = $derived(open ?? kept)

  const follow = (href: string) => {
    read = href
    onCurrentChange?.(href)
  }
  const setOpen = (next: boolean) => {
    if (open === undefined) kept = next
    onOpenChange?.(next)
  }

  const hrefs = $derived(anchorHrefs(items).join(' '))
  $effect(() => {
    const list = hrefs.split(' ')
    const line = offset
    return untrack(() => watchScrollSpy(document, list, { offset: line, onChange: follow }))
  })
  $effect(() => {
    const query = anchorFloatQuery(float)
    return untrack(() => watchMedia(document, query, (matches) => (narrow = matches)))
  })

  let panel = $state<HTMLElement | null>(null)
  let trigger = $state<HTMLElement | null>(null)
  const engaged = $derived(floating && shown)
  $effect(() => {
    if (!engaged || !panel) return
    const node = panel
    return untrack(() => attachAnchorPanel(node, trigger, () => setOpen(false)))
  })

  const api = $derived(
    connect(
      { id, label, items, words, onCurrentChange: follow, onOpenChange: setOpen },
      { current: current ?? read, floating, open: engaged },
      svelteNormalizer
    )
  )
</script>

{#snippet list(entries: AnchorItem[], level: 1 | 2)}
  <ul {...api.listProps(level)}>
    {#each entries as item (item.href)}
      {@const parts = api.getItemProps(item, level)}
      <li {...parts.itemProps}>
        <a {...parts.linkProps}>{item.label}</a>
        {#if parts.sections.length > 0}{@render list(parts.sections, 2)}{/if}
      </li>
    {/each}
  </ul>
{/snippet}

<nav {...rest} {...api.rootProps}>
  <div bind:this={panel} {...api.panelProps}>
    {@render list(items, 1)}
  </div>
  {#if api.showTrigger}
    <button bind:this={trigger} {...api.triggerProps}><span {...api.triggerIconProps}></span><span {...api.triggerLabelProps}>{api.triggerText}</span></button>
  {/if}
</nav>
