<script lang="ts">
  import { connect as connectTarget, contextMenuAnchor } from '@ggary/core/context-menu'
  import { connect as connectMenu, createMenuMachine, type MenuEntry, type MenuSelectDetails } from '@ggary/core/menu'
  import { svelteNormalizer, uid, type Dict, type VirtualElement } from '@ggary/core'
  import { untrack, type Snippet } from 'svelte'
  import MenuContent from '../menu/MenuContent.svelte'

  type Props = {
    /** Actions, checkbox and radio items, submenus, separators and groups: a Menu's. */
    items: MenuEntry[]
    onSelect?: (value: string, details: MenuSelectDetails) => void
    /** The element the menu belongs to: spread the props onto it, with a tabindex if it is not focusable. */
    trigger: Snippet<[Dict]>
    /** The menu's accessible name. Default "Actions". */
    label?: string
    closeOnSelect?: boolean
  }

  let { items, onSelect, trigger, label = 'Actions', closeOnSelect }: Props = $props()

  let element: HTMLElement | null = null
  let anchor: HTMLElement | VirtualElement | null = null

  const machine = createMenuMachine({
    id: uid('gg-context-menu'),
    items: untrack(() => items),
    closeOnSelect: untrack(() => closeOnSelect),
    onSelect: (value, details) => onSelect?.(value, details),
  })
  let snapshot = $state.raw(machine.getState())
  machine.subscribe(() => (snapshot = machine.getState()))
  const api = $derived(connectMenu(snapshot, machine.send, svelteNormalizer, { label }))

  $effect(() => machine.send({ type: 'SYNC_ITEMS', items }))
  $effect(() => machine.send({ type: 'SYNC_OPTIONS', closeOnSelect }))

  const target = $derived(
    connectTarget({ open: snapshot.open }, svelteNormalizer, {
      onRequest: (request) => {
        element = request.element
        anchor = contextMenuAnchor(request)
        // The keyboard lands on the first item; a pointer, on the menu itself.
        machine.send({ type: 'OPEN', reason: 'api', focus: request.point ? 'none' : 'first' })
      },
    })
  )
</script>

{@render trigger(target.targetProps)}
<MenuContent {api} getState={machine.getState} reference={() => element} anchor={() => anchor} dismissOnReference />
