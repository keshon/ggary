<script lang="ts">
  import {
    connect,
    createMenuMachine,
    hasIndicator,
    menuHighlightedId,
    type MenuChangeDetails,
    type MenuEntry,
    type MenuItem,
    type MenuPlacement,
    type MenuSelectDetails,
  } from '@ggary/core/menu'
  import { attachPopover, focusMenuItem, scrollIntoViewIfNeeded, svelteNormalizer, uid, type AttachedPopover, type Dict } from '@ggary/core'
  import { untrack, type Snippet } from 'svelte'

  type Props = {
    /** Actions, checkbox and radio items, separators and labelled groups. */
    items: MenuEntry[]
    /** The anchor and opener: `{#snippet trigger(props)}<Button {...props}>…</Button>{/snippet}` */
    trigger: Snippet<[Dict]>
    /** Called with the item's value when the user activates it. */
    onSelect?: (value: string, details: MenuSelectDetails) => void
    /** Bindable: `bind:open`. */
    open?: boolean
    defaultOpen?: boolean
    onOpenChange?: (open: boolean, details: MenuChangeDetails) => void
    placement?: MenuPlacement
    /** Close after an item is activated. Default true; an item can override it. */
    closeOnSelect?: boolean
    /** The menu's accessible name. Default: the trigger's text. */
    label?: string
  }

  let {
    items,
    trigger,
    onSelect,
    open = $bindable(),
    defaultOpen,
    onOpenChange,
    placement,
    closeOnSelect,
    label,
  }: Props = $props()

  const id = uid('gg-menu')

  // As Popover: uncontrolled at heart, as `bind:open` is.
  const machine = untrack(() =>
    createMenuMachine({
      id,
      items,
      defaultOpen: open ?? defaultOpen,
      placement,
      closeOnSelect,
      onOpenChange: (next, details) => {
        open = next
        onOpenChange?.(next, details)
      },
      onSelect: (value, details) => onSelect?.(value, details),
    })
  )

  let snapshot = $state(machine.getState())
  $effect(() => machine.subscribe((next) => (snapshot = next)))

  const api = $derived(connect(snapshot, machine.send, svelteNormalizer, { label }))

  $effect(() => machine.send({ type: 'SYNC_ITEMS', items }))
  $effect(() => {
    if (open !== undefined) machine.send({ type: 'SYNC_OPEN', open })
  })
  $effect(() => machine.send({ type: 'SYNC_OPTIONS', placement, closeOnSelect }))

  let content: HTMLDivElement
  let attached: AttachedPopover | null = null

  $effect(() => {
    if (!snapshot.open) return
    const instance = untrack(() => {
      const reference = document.getElementById(api.ids.trigger)
      if (!reference) return null
      return attachPopover(reference, content, {
        placement: machine.getState().placement,
        gutter: 4,
        // Focus goes back to the trigger on close; where it goes on open is the
        // highlight's business, below.
        manageFocus: true,
        onDismiss: (reason) => machine.send({ type: 'CLOSE', reason }),
        // The size limit arrives after the focus below: scroll again against it.
        onPlaced: () => scrollIntoViewIfNeeded(document.getElementById(menuHighlightedId(machine.getState()) ?? ''), content),
      })
    })
    attached = instance
    return () => {
      instance?.destroy()
      attached = null
    }
  })

  $effect(() => {
    const next = { placement: snapshot.placement }
    untrack(() => attached?.update(next))
  })

  // After the attach above, so the menu is shown and can take focus.
  $effect(() => {
    if (snapshot.open) focusMenuItem(content, api.highlightedId)
  })
</script>

{#snippet row(item: MenuItem, index: number)}
  {@const props = api.getItemProps(item, index)}
  {#if props.href}
    <a {...props}>{@render inner(item)}</a>
  {:else}
    <div {...props}>{@render inner(item)}</div>
  {/if}
{/snippet}

{#snippet inner(item: MenuItem)}
  <span {...api.getItemTextProps()}>{item.label}</span>
  {#if item.shortcut}
    <span {...api.getItemShortcutProps()}>{item.shortcut}</span>
  {/if}
  {#if hasIndicator(item)}
    <span {...api.getItemIndicatorProps(item)}></span>
  {/if}
{/snippet}

{@render trigger(api.triggerProps)}
<div bind:this={content} {...api.contentProps}>
  {#each api.nodes as node (node.key)}
    {#if node.kind === 'separator'}
      <div {...api.separatorProps}></div>
    {:else if node.kind === 'item'}
      {@render row(node.item, node.index)}
    {:else}
      <div {...api.getGroupProps(node)}>
        {#if node.label}
          <div {...api.getGroupLabelProps(node)}>{node.label}</div>
        {/if}
        {#each node.items as entry (entry.item.value)}
          {@render row(entry.item, entry.index)}
        {/each}
      </div>
    {/if}
  {/each}
</div>
