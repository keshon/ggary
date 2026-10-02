<script lang="ts">
  import { Table } from '../../../packages/svelte/src/index'
  import { textOf } from '../../../packages/core/src/components/table'

  let { renderCell, ...rest }: any = $props()
</script>

{#snippet cell(row: any, column: any, index: number)}
  {@const custom = renderCell ? renderCell(row, column, index) : undefined}
  {#if custom != null}{custom}{:else}{textOf(column.value ? column.value(row) : row[column.id])}{/if}
{/snippet}

<Table {...rest} {cell} />
