<script lang="ts" generics="Row">
  import { rowMenuAnchor, rowMenuTarget, type DataGridController, type RowMenuTarget, type VirtualAnchor } from '@ggary/core/data-grid'
  import { connect, createMenuMachine, type MenuEntry, type MenuSelectDetails } from '@ggary/core/menu'
  import { svelteNormalizer, uid } from '@ggary/core'
  import { untrack } from 'svelte'
  import MenuContent from '../menu/MenuContent.svelte'

  type Props = {
    grid: DataGridController<Row>
    /** The menu for a row; `target.selection` is set when the row is one of a selection of several. */
    items: (target: RowMenuTarget<Row>) => MenuEntry[]
    onSelect: (value: string, target: RowMenuTarget<Row>, details: MenuSelectDetails) => void
    /** The menu's accessible name. */
    label?: string
  }

  let { grid, items, onSelect, label = 'Row actions' }: Props = $props()

  /*
   * A row's context menu: a right click, Shift+F10 or the menu key on a row.
   * It stands at the pointer, or under the active cell for the keyboard, and
   * gives the focus back to the grid when it closes.
   */
  let target: RowMenuTarget<Row> | null = null
  let anchor: VirtualAnchor | null = null

  const machine = createMenuMachine({
    id: uid('gg-grid-menu'),
    items: [],
    onSelect: (value, details) => {
      if (target) onSelect(value, target, details)
    },
  })
  let snapshot = $state.raw(machine.getState())
  machine.subscribe(() => (snapshot = machine.getState()))
  const api = $derived(connect(snapshot, machine.send, svelteNormalizer, { label }))

  $effect(() => grid.provide('menu'))

  $effect(() => {
    let seen = grid.getSnapshot().grid.menu?.nonce ?? 0
    return grid.subscribe(() => {
      const snapshot = grid.getSnapshot()
      const nonce = snapshot.grid.menu?.nonce ?? 0
      if (nonce === seen) return
      seen = nonce
      const found = rowMenuTarget(snapshot, grid)
      if (!found) return
      target = found
      anchor = rowMenuAnchor(snapshot, grid as DataGridController<unknown>)
      untrack(() => {
        machine.send({ type: 'SYNC_ITEMS', items: items(found) })
        // The keyboard lands on the first item; a pointer, on the menu itself.
        machine.send({ type: 'OPEN', reason: 'api', focus: snapshot.grid.menu?.point ? 'none' : 'first' })
      })
    })
  })
</script>

<MenuContent {api} getState={machine.getState} reference={() => grid.element} anchor={() => anchor} dismissOnReference />
