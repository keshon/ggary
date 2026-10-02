<script lang="ts">
  import type { TableColumnDef, TableRowKey } from '@ggary/core/table'
  import { textOf } from '@ggary/core/table'
  import { Badge, Button, Table } from '@ggary/svelte'
  import DemoPage from '../../svelte/DemoPage.svelte'
  import Specimen from '../../svelte/Specimen.svelte'
  import { dealColumns, deals, type Deal } from './data'

  const stageTone = { New: 'neutral', 'In talks': 'running', 'Offer sent': 'warn', Won: 'ok' } as const
  const keyOf = (row: Deal) => row.company
  let selection: TableRowKey[] = $state(['Acme Labs', 'Delta Retail'])
</script>

{#snippet cell(row: Deal, column: TableColumnDef<Deal>)}
  {#if column.id === 'stage'}
    <Badge tone={stageTone[row.stage]}>{row.stage}</Badge>
  {:else if column.id === 'actions'}
    <Button size="sm" emphasis="low">Open</Button>
  {:else}
    {textOf(column.value ? column.value(row) : row[column.id as keyof Deal])}
  {/if}
{/snippet}

<DemoPage>
  {#snippet variants()}
    <Specimen label={`caption="Pipeline"`} wide>
      <Table caption="Pipeline" columns={dealColumns} rows={deals} getRowKey={keyOf} />
    </Specimen>
    <Specimen label="selectable" wide>
      <Table
        label="Deals"
        columns={dealColumns}
        rows={deals}
        getRowKey={keyOf}
        selectable
        bind:selection
        rowName={(row) => row.company}
        {cell}
      />
      <p>{selection.length} selected</p>
    </Specimen>
  {/snippet}
  {#snippet states()}
    <Specimen label="empty" wide>
      <Table label="Deals" columns={dealColumns} rows={[]} />
    </Specimen>
    <Specimen label="defaultSort" wide>
      <Table label="Deals" columns={dealColumns} rows={deals} defaultSort={{ column: 'value', direction: 'desc' }} />
    </Specimen>
  {/snippet}
  {#snippet composition()}
    <Specimen label="custom cells" wide>
      <Table label="Deals" columns={dealColumns} rows={deals} getRowKey={keyOf} {cell} />
    </Specimen>
    <Specimen label="sticky header" wide>
      <div style="max-height: 220px; overflow: auto;">
        <Table
          label="Deals"
          columns={dealColumns}
          rows={[...deals, ...deals]}
          getRowKey={(row, index) => `${row.company}-${index}`}
          {cell}
        />
      </div>
    </Specimen>
  {/snippet}
</DemoPage>
