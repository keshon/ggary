<script lang="ts">
  import { DataGrid, GridRowMenu, Kanban, Dialog } from '../../packages/svelte/src/index'
  import type { DataGridController } from '../../packages/core/src/components/data-grid'
  import { columns, tasks } from '../conformance/board'
  let grid = $state<DataGridController<{ id: number; name: string }>>()
  let selected = $state('')
  let selectedCard = $state('')
</script>
<Dialog title="Domain menus">
  {#snippet trigger(props)}<button {...props}>Open domain menus</button>{/snippet}
  <DataGrid columns={[{ id: 'name', header: 'Company' }]} rows={[{ id: 1, name: 'Alpha' }, { id: 2, name: 'Bravo' }]} rowKey={row => row.id} label="Companies" bind:controller={grid} />
  {#if grid}<GridRowMenu {grid} items={() => [{ value: 'open', label: 'Open row' }, { value: 'archive', label: 'Archive row' }]} onSelect={(value, target) => selected = `${value}:${target.row.id}`} />{/if}
  <Kanban {columns} cards={tasks} cardMenu={() => [{ value: 'archive', label: 'Archive card' }]} onCardMenuSelect={(value, card) => selectedCard = `${value}:${card.id}`} />
  <output aria-label="Row selection">{selected}</output>
  <output aria-label="Card selection">{selectedCard}</output>
</Dialog>
