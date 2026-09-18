/**
 * The data grid's vocabulary. The grid never holds a dataset: it holds a QUERY
 * — sort, filters, search, and the range of rows on screen — and a source
 * answers it, from an array in the page or from a server. The same component
 * then works for twenty rows and for seven hundred thousand.
 */

export type RowKey = string | number

export type ColumnType = 'text' | 'number' | 'money' | 'percent' | 'date' | 'datetime' | 'enum' | 'boolean'

export type FilterKind = 'text' | 'set' | 'range' | 'date'

export type FilterValue = string | number | boolean | null

export interface ColumnOption {
  value: FilterValue
  label: string
}

export interface ColumnDef<Row = any> {
  id: string
  /** Words a person reads, never an internal key: "Manager, 1st line", not "manager1L". */
  header: string
  /** What the column means, when the header cannot say it in two words. */
  description?: string
  /** Decides alignment, formatting and the default filter. Text by default. */
  type?: ColumnType
  /** Reads the cell's value. Defaults to `row[id]`. */
  value?: (row: Row) => unknown
  width?: number
  minWidth?: number
  maxWidth?: number
  /** Stays in view while the rest scrolls sideways — a name, an email. */
  pinned?: 'start' | 'end'
  /** True unless the column has no value to order by. */
  sortable?: boolean
  /** The filter this column offers; `false` offers none. Defaults by type. */
  filter?: FilterKind | false
  /** Taken into the free-text search. Text columns are, by default. */
  searchable?: boolean
  /** Starts hidden; the column picker can show it. */
  hidden?: boolean
  /** The values of an enum or set filter, with the words for each. */
  options?: ColumnOption[]
  /** ISO 4217, for money columns. */
  currency?: string
  /**
   * Edited in place: F2, Enter, a double click or typing. A function decides
   * per row — a closed deal's sum, say, stays as it is.
   */
  editable?: boolean | ((row: Row) => boolean)
  /** Writes an edited value into a copy of the row. Defaults to `{ ...row, [id]: value }`. */
  setValue?: (row: Row, value: unknown) => Row
  /** Refuses a value before it is saved: return the words to show, or nothing. */
  validate?: (value: unknown, row: Row) => string | null | undefined
}

export type SortDirection = 'asc' | 'desc'

export interface SortKey {
  column: string
  direction: SortDirection
}

export type Filter =
  /** Contains, case- and accent-insensitive. */
  | { column: string; kind: 'text'; value: string }
  /** One of these values; `null` stands for "empty". */
  | { column: string; kind: 'set'; values: FilterValue[] }
  /** Inclusive at both ends; a missing end is open. */
  | { column: string; kind: 'range'; min?: number; max?: number }
  /** ISO dates or datetimes, inclusive; a date-only `to` means the whole of that day. */
  | { column: string; kind: 'date'; from?: string; to?: string }

export interface GridQuery {
  /** The first key orders, the next ones break its ties. */
  sort: SortKey[]
  /** All of them hold: filters are joined with AND. */
  filters: Filter[]
  /** Every word must appear in some searchable column. */
  search: string
}

/** Rows `start` up to, not including, `end`. */
export interface RowRange {
  start: number
  end: number
}

export interface GridRequest extends GridQuery {
  range: RowRange
}

export interface GridPage<Row> {
  rows: Row[]
  /** How many rows match the query in all — not how many came back. */
  total: number
}

/**
 * What answers the grid. `signal` aborts when the answer is no longer wanted —
 * the query changed, or the rows were scrolled past — and a source should pass
 * it on to fetch() so the server stops working too.
 */
export interface GridSource<Row> {
  load(request: GridRequest, signal: AbortSignal): Promise<GridPage<Row>>
}

export interface ColumnState {
  id: string
  width: number
  minWidth: number
  maxWidth: number
  hidden: boolean
  pinned?: 'start' | 'end'
}

/**
 * Either a list of rows, or "everything matching the query, except these".
 * The second is how "select all 12,400" works without 12,400 keys: a bulk
 * action receives the query and the exceptions, and the server does the rest.
 */
export type Selection =
  | { mode: 'keys'; keys: ReadonlySet<RowKey> }
  | { mode: 'matching'; except: ReadonlySet<RowKey> }

/** What a bulk action is handed. */
export type SelectionPayload =
  | { mode: 'keys'; keys: RowKey[] }
  | { mode: 'matching'; query: GridQuery; except: RowKey[] }

/** What a save is handed: the row as it was, as it will be, and the one value that changed. */
export interface CellEdit<Row> {
  row: Row
  next: Row
  key: RowKey
  index: number
  column: ColumnDef<Row>
  value: unknown
  previous: unknown
}
