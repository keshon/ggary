<script lang="ts">
  import {
    connect,
    createMenuMachine,
    type MenuChangeDetails,
    type MenuEntry,
    type MenuPlacement,
    type MenuSelectDetails,
  } from '@ggary/core/menu'
  import { svelteNormalizer, uid, type Dict } from '@ggary/core'
  import { untrack, type Snippet } from 'svelte'
  import MenuContent from './MenuContent.svelte'

  type Props = {
    /** Actions, checkbox and radio items, submenus, separators and labelled groups. */
    items: MenuEntry[]
    /** The anchor and opener: `{#snippet trigger(props)}<Button {...props}>…</Button>{/snippet}` */
    trigger: Snippet<[Dict]>
    /** Called with the item's value when the user activates it, at any depth. */
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
</script>

{@render trigger(api.triggerProps)}
<MenuContent {api} getState={machine.getState} reference={() => document.getElementById(api.ids.trigger)} />
