import { createMachine, withEffects, type Machine } from '../../machine'
import { syncOptions } from '../../utils/open-intent'
import type { TableColumnDef, TableEvent, TableRowKey, TableSort, TableState } from './table.types'

/**
 * Orders two cell values. Missing values sort last in either direction; dates
 * order by time, numbers by size, and anything else reads alphabetically with
 * numbers inside words ordered as numbers ("Row 2" before "Row 10").
 */
export function compareValues(a: unknown, b: unknown): number {
  const missing = (value: unknown) => value === null || value === undefined || (typeof value === 'number' && Number.isNaN(value))
  if (missing(a) && missing(b)) return 0
  if (missing(a)) return 1
  if (missing(b)) return -1
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime()
  if (typeof a === 'number' && typeof b === 'number') return a - b
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b)
  return String(a).localeCompare(String(b), undefined, { numeric: true })
}

const readSortValue = <Row,>(column: TableColumnDef<Row>, row: Row): unknown =>
  column.sortValue ? column.sortValue(row) : column.value ? column.value(row) : (row as Record<string, unknown>)[column.id]

/** The rows in reading order: sorted when a sort stands, stable either way. */
export function sortEntries<Row,>(
  rows: Row[],
  columns: TableColumnDef<Row>[],
  sort: TableSort | null
): { row: Row; index: number }[] {
  const decorated = rows.map((row, index) => ({ row, index }))
  if (sort === null) return decorated
  const column = columns.find((candidate) => candidate.id === sort.column)
  if (!column || column.sortable === false) return decorated
  const sign = sort.direction === 'asc' ? 1 : -1
  return decorated
    .map((entry, position) => ({ ...entry, position }))
    .sort((a, b) => compareValues(readSortValue(column, a.row), readSortValue(column, b.row)) * sign || a.position - b.position)
    .map(({ row, index }) => ({ row, index }))
}

const keysOf = <Row,>(state: TableState<Row>): TableRowKey[] => state.rows.map((row, index) => state.getRowKey(row, index))

/** The sort the user asked for is always heard as intent; the state follows only when uncontrolled. */
function commitSort<Row,>(state: TableState<Row>, sort: TableSort | null): TableState<Row> {
  const next = { ...state, sortIntent: { sort, nonce: state.sortIntent.nonce + 1 } }
  return state.sortControlled ? next : { ...next, sort }
}

function commitSelection<Row,>(state: TableState<Row>, selection: TableRowKey[]): TableState<Row> {
  const next = { ...state, selectIntent: { selection, nonce: state.selectIntent.nonce + 1 } }
  return state.selectionControlled ? next : { ...next, selection }
}

export function reducer<Row,>(state: TableState<Row>, event: TableEvent<Row>): TableState<Row> {
  switch (event.type) {
    case 'SORT': {
      const column = state.columns.find((candidate) => candidate.id === event.column)
      if (!column || column.sortable === false) return state
      const current = state.sort?.column === event.column ? state.sort.direction : null
      const next: TableSort | null =
        current === null ? { column: event.column, direction: 'asc' } : current === 'asc' ? { column: event.column, direction: 'desc' } : null
      if (JSON.stringify(next) === JSON.stringify(state.sort)) return state
      return commitSort(state, next)
    }

    case 'SELECT_ROW': {
      if (!state.selectable) return state
      const selected = state.selection.includes(event.key)
      return commitSelection(
        state,
        selected ? state.selection.filter((key) => key !== event.key) : [...state.selection, event.key]
      )
    }

    case 'SELECT_ALL': {
      if (!state.selectable) return state
      const keys = keysOf(state)
      const all = keys.length > 0 && keys.every((key) => state.selection.includes(key))
      return commitSelection(state, all ? [] : keys)
    }

    case 'SYNC_ROWS': {
      if (event.rows === state.rows) return state
      const next: TableState<Row> = { ...state, rows: event.rows }
      // Chosen rows that went away stop being chosen; the owner hears the remainder.
      const kept = next.selection.filter((key) => keysOf(next).includes(key))
      return kept.length === next.selection.length ? next : commitSelection(next, kept)
    }

    case 'SYNC_COLUMNS': {
      if (event.columns === state.columns) return state
      const next: TableState<Row> = { ...state, columns: event.columns }
      const standing = next.columns.find((column) => column.id === next.sort?.column)
      if (next.sort !== null && (!standing || standing.sortable === false)) return commitSort(next, null)
      return next
    }

    case 'SYNC_SORT': {
      if (JSON.stringify(event.sort) === JSON.stringify(state.sort)) return state
      return { ...state, sort: event.sort }
    }

    case 'SYNC_SELECTION': {
      if (event.selection === state.selection) return state
      return { ...state, selection: event.selection }
    }

    case 'SYNC_OPTIONS': {
      const { type: _type, ...options } = event
      const next = syncOptions(state, { selectable: false }, options) as TableState<Row>
      if (next === state) return state
      // A table that stops being selectable stops holding a selection, and says so.
      if (state.selectable && !next.selectable && next.selection.length > 0) return commitSelection(next, [])
      return next
    }
  }
}

export interface TableMachineConfig<Row = any> {
  id: string
  columns?: TableColumnDef<Row>[]
  rows?: Row[]
  getRowKey?: (row: Row, index: number) => TableRowKey
  selectable?: boolean
  /** Pass `sort` for controlled mode; `defaultSort` for uncontrolled. Default: unsorted. */
  sort?: TableSort | null
  defaultSort?: TableSort | null
  onSortChange?: (sort: TableSort | null) => void
  /** Pass `selection` for controlled mode; `defaultSelection` for uncontrolled. */
  selection?: TableRowKey[]
  defaultSelection?: TableRowKey[]
  onSelectionChange?: (selection: TableRowKey[]) => void
}

export function initialState<Row,>(config: TableMachineConfig<Row>): TableState<Row> {
  const sortControlled = config.sort !== undefined
  const selectionControlled = config.selection !== undefined
  return {
    id: config.id,
    columns: config.columns ?? [],
    rows: config.rows ?? [],
    getRowKey: config.getRowKey ?? ((row, index) => index),
    selectable: config.selectable ?? false,
    sort: sortControlled ? config.sort ?? null : config.defaultSort ?? null,
    sortControlled,
    selection: selectionControlled ? config.selection ?? [] : config.defaultSelection ?? [],
    selectionControlled,
    // Nonces start at 0: never asked.
    sortIntent: { sort: null, nonce: 0 },
    selectIntent: { selection: [], nonce: 0 },
  }
}

export function createTableMachine<Row,>(config: TableMachineConfig<Row>): Machine<TableState<Row>, TableEvent<Row>> {
  const machine = createMachine<TableState<Row>, TableEvent<Row>>(initialState(config), reducer<Row>)
  return withEffects(machine, (previous, next) => {
    if (next.sortIntent.nonce !== previous.sortIntent.nonce) {
      config.onSortChange?.(next.sortIntent.sort)
    }
    if (next.selectIntent.nonce !== previous.selectIntent.nonce) {
      config.onSelectionChange?.(next.selectIntent.selection)
    }
  })
}
