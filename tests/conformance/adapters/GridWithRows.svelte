<script lang="ts">
  import { DataGrid, GridDetail, GridRowMenu } from '../../../packages/svelte/src/index'
  import type { DataGridController } from '../../../packages/core/src/components/data-grid'
  import type { GridRowsProps } from '../harness'

  let { columns, rows, locale, onCellEdit, menuItems, onMenuSelect, detailTitle, detailBody }: GridRowsProps = $props()
  let grid = $state<DataGridController<any>>()
</script>

<DataGrid {columns} {rows} rowKey={(row: { id: number }) => row.id} label="Leads" {locale} {onCellEdit} bind:controller={grid} />
{#if grid}
  <GridRowMenu {grid} items={menuItems} onSelect={onMenuSelect} />
  <GridDetail {grid} title={detailTitle}>
    {#snippet children(row: any)}<p>{detailBody(row)}</p>{/snippet}
  </GridDetail>
{/if}
