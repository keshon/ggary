import { useState } from 'react'
import type { TableColumnDef, TableRowKey } from '@ggary/core/table'
import { Badge, Button, Table } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { dealColumns, deals, type Deal } from './data'

const stageTone = { New: 'neutral', 'In talks': 'running', 'Offer sent': 'warn', Won: 'ok' } as const

/** A cell of your own: badges for stages, a button to drill down. */
function renderCell(row: Deal, column: TableColumnDef<Deal>) {
  if (column.id === 'stage') return <Badge tone={stageTone[row.stage]}>{row.stage}</Badge>
  if (column.id === 'actions')
    return (
      <Button size="sm" emphasis="low">
        Open
      </Button>
    )
  return undefined
}

/** Selection is read back, as any page's own state is. */
function Selectable() {
  const [selection, setSelection] = useState<TableRowKey[]>(['Acme Labs', 'Delta Retail'])
  return (
    <>
      <Table
        label="Deals"
        columns={dealColumns}
        rows={deals}
        getRowKey={(row) => row.company}
        selectable
        selection={selection}
        onSelectionChange={setSelection}
        rowName={(row) => row.company}
        renderCell={renderCell}
      />
      <p>{selection.length} selected</p>
    </>
  )
}

export default function TablePage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label={`caption="Pipeline"`} wide>
            <Table caption="Pipeline" columns={dealColumns} rows={deals} getRowKey={(row) => row.company} />
          </Specimen>
          <Specimen label="selectable" wide>
            <Selectable />
          </Specimen>
        </>
      }
      states={
        <>
          <Specimen label="empty" wide>
            <Table label="Deals" columns={dealColumns} rows={[]} />
          </Specimen>
          <Specimen label="defaultSort" wide>
            <Table label="Deals" columns={dealColumns} rows={deals} defaultSort={{ column: 'value', direction: 'desc' }} />
          </Specimen>
        </>
      }
      composition={
        <>
          <Specimen label="custom cells" wide>
            <Table label="Deals" columns={dealColumns} rows={deals} getRowKey={(row) => row.company} renderCell={renderCell} />
          </Specimen>
          <Specimen label="sticky header" wide>
            <div style={{ maxHeight: '220px', overflow: 'auto' }}>
              <Table label="Deals" columns={dealColumns} rows={[...deals, ...deals]} getRowKey={(row, index) => `${row.company}-${index}`} renderCell={renderCell} />
            </div>
          </Specimen>
        </>
      }
    />
  )
}
