/** Along the row. A column the owner leaves alone starts where text starts. */
export type TableAlign = 'start' | 'center' | 'end'

export type TableRowKey = string | number

export interface TableColumnDef<Row = any> {
  id: string
  /** Words a person reads, never an internal key: "Deal size", not "amount". */
  header: string
  /** Reads the cell's value. Defaults to `row[id]`. */
  value?: (row: Row) => unknown
  /** Orders rows by this instead of the shown value. */
  sortValue?: (row: Row) => unknown
  /** True unless the column has nothing to order by. Default true. */
  sortable?: boolean
  /** Default: numbers end, everything else starts. */
  align?: TableAlign
  /** A width hint the auto layout reads, as CSS wants it: '120px', '20%'. */
  width?: string
}

export type TableSortDirection = 'asc' | 'desc'

export interface TableSort {
  column: string
  direction: TableSortDirection
}

export interface TableWords {
  /** No rows at all. Default "No rows". */
  empty?: string
  /** The header checkbox. Default "Select all rows". */
  selectAll?: string
}

export interface TableState<Row = any> {
  id: string
  columns: TableColumnDef<Row>[]
  rows: Row[]
  getRowKey: (row: Row, index: number) => TableRowKey
  selectable: boolean
  /** The sort the header shows. Null is unsorted, the third press of a sort button. */
  sort: TableSort | null
  sortControlled: boolean
  selection: TableRowKey[]
  selectionControlled: boolean
  /** The sort the user asked for; `onSortChange` fires on it. */
  sortIntent: { sort: TableSort | null; nonce: number }
  /** The selection the user asked for; `onSelectionChange` fires on it. */
  selectIntent: { selection: TableRowKey[]; nonce: number }
}

export type TableEvent<Row = any> =
  /** A sort button pressed: none goes asc, asc goes desc, desc clears. */
  | { type: 'SORT'; column: string }
  | { type: 'SELECT_ROW'; key: TableRowKey }
  /** All of the shown rows, or none when they are all already chosen. */
  | { type: 'SELECT_ALL' }
  | { type: 'SYNC_ROWS'; rows: Row[] }
  | { type: 'SYNC_COLUMNS'; columns: TableColumnDef<Row>[] }
  | { type: 'SYNC_SORT'; sort: TableSort | null }
  | { type: 'SYNC_SELECTION'; selection: TableRowKey[] }
  | ({ type: 'SYNC_OPTIONS' } & { selectable?: boolean })
