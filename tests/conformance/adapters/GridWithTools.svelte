<script lang="ts">
  import { DataGrid, GridBulkBar, GridColumns, GridFilters } from '../../../packages/svelte/src/index'
  import type { DataGridController } from '../../../packages/core/src/components/data-grid'

  let { columns, rows, views, locale }: { columns: any[]; rows: any[]; views?: any[]; locale?: string } = $props()
  let grid = $state<DataGridController<any>>()
</script>

{#if grid}
  <GridFilters {grid} {views} words={{ locale }} />
  <GridColumns {grid} />
  <GridBulkBar {grid} words={{ locale }}><button type="button">Assign</button></GridBulkBar>
{/if}
<DataGrid {columns} {rows} rowKey={(row: { id: number }) => row.id} label="Leads" selectable {locale} bind:controller={grid} />
