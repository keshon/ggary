import { queryKey } from './data-grid.query'
import { emptySelection, selectAllMatching, setKeys, toggleKey } from './data-grid.selection'
import type { ColumnDef, ColumnState, Filter, GridQuery, RowKey, Selection } from './data-grid.types'

/**
 * Everything a person changes about the grid: the query, the columns, what is
 * selected and which row has the focus. Pure — the rows themselves live in the
 * loader, and the adapters connect the two.
 */

export interface GridState {
  query: GridQuery
  /** In display order. */
  columns: ColumnState[]
  selection: Selection
  /** The row a Shift range is measured from. */
  anchor: number | null
  /**
   * The active cell: a row by its index in the current query's order (-1 is
   * the header row), and a column by its position among the visible ones.
   */
  focus: { row: number; column: number } | null
  /**
   * The cell being edited, and what its editor holds. `error` is why the draft
   * cannot be saved yet; the editor stays open until it can, or is cancelled.
   */
  editing: { row: number; column: number; draft: string; error?: string } | null
  /**
   * Cells with a save in flight or a save that failed, by `cellKey`. They
   * outlive a query: a save does not care where its row is shown now.
   */
  saves: Readonly<Record<string, CellSave>>
  /** The row open in the detail sheet, by index; it follows the active row. */
  detail: number | null
  /**
   * The last request for a row's context menu. A menu listens for a new
   * `nonce`; `point` is where the pointer was, or null for the keyboard's
   * request, which opens at the active cell.
   */
  menu: { row: number; column: number; point: { x: number; y: number } | null; nonce: number } | null
  /** The last save that failed, for the status line to say so. Cleared by the next edit. */
  notice: { column: string; message: string } | null
}

export type CellSave = { status: 'saving' } | { status: 'failed'; message: string; column: string }

export type GridEvent =
  /** Cycles asc → desc → off. With `additive`, the column joins the sort instead of replacing it. */
  | { type: 'SORT'; column: string; additive?: boolean }
  | { type: 'SET_SORT'; sort: GridQuery['sort'] }
  /** One filter per column: a new one replaces the old. */
  | { type: 'SET_FILTER'; filter: Filter }
  | { type: 'CLEAR_FILTER'; column: string }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'SET_SEARCH'; search: string }
  | { type: 'SET_QUERY'; query: GridQuery }
  | { type: 'RESIZE'; column: string; width: number }
  | { type: 'SET_HIDDEN'; column: string; hidden: boolean }
  | { type: 'MOVE'; column: string; to: number }
  | { type: 'PIN'; column: string; pinned?: 'start' | 'end' }
  | { type: 'SET_COLUMNS'; columns: ColumnState[] }
  | { type: 'FOCUS'; row: number; column: number }
  | { type: 'BLUR' }
  /** Plain click or Space: this row alone joins or leaves the selection. */
  | { type: 'TOGGLE'; key: RowKey; index: number }
  /** Shift: from the anchor to here. The adapter resolves the keys between. */
  | { type: 'SELECT_RANGE'; keys: readonly RowKey[]; index: number }
  | { type: 'SELECT_ALL_MATCHING' }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'EDIT_START'; row: number; column: number; draft: string }
  | { type: 'EDIT_DRAFT'; draft: string }
  | { type: 'EDIT_ERROR'; error: string }
  | { type: 'EDIT_END' }
  | { type: 'SAVE_START'; cell: string }
  | { type: 'SAVE_DONE'; cell: string }
  | { type: 'SAVE_FAILED'; cell: string; column: string; message: string }
  | { type: 'OPEN_DETAIL'; row: number }
  | { type: 'CLOSE_DETAIL' }
  | { type: 'REQUEST_MENU'; row: number; column: number; point: { x: number; y: number } | null }

export const DEFAULT_WIDTHS: Record<string, number> = {
  text: 180,
  number: 110,
  money: 130,
  percent: 100,
  date: 130,
  datetime: 170,
  enum: 150,
  boolean: 90,
}

export function initialColumns(columns: readonly ColumnDef[]): ColumnState[] {
  return columns.map((column) => {
    const minWidth = column.minWidth ?? 64
    const maxWidth = column.maxWidth ?? 800
    const width = Math.min(maxWidth, Math.max(minWidth, column.width ?? DEFAULT_WIDTHS[column.type ?? 'text']))
    return { id: column.id, width, minWidth, maxWidth, hidden: column.hidden ?? false, pinned: column.pinned }
  })
}

export const emptyQuery: GridQuery = { sort: [], filters: [], search: '' }

export function initialGridState(columns: readonly ColumnDef[], query: Partial<GridQuery> = {}): GridState {
  return {
    query: { ...emptyQuery, ...query },
    columns: initialColumns(columns),
    selection: emptySelection,
    anchor: null,
    focus: null,
    editing: null,
    saves: {},
    detail: null,
    menu: null,
    notice: null,
  }
}

function nextSort(sort: GridQuery['sort'], column: string, additive: boolean): GridQuery['sort'] {
  const current = sort.find((key) => key.column === column)
  const cycled = !current ? 'asc' : current.direction === 'asc' ? 'desc' : null
  if (!additive) {
    // A plain click on a column that was only breaking ties starts it afresh:
    // "sort by this" — not "flip what it was doing as a tie-breaker".
    if (current && sort.length > 1) return [{ column, direction: 'asc' }]
    return cycled ? [{ column, direction: cycled }] : []
  }
  if (!current) return [...sort, { column, direction: 'asc' }]
  return cycled ? sort.map((key) => (key.column === column ? { column, direction: cycled } : key)) : sort.filter((key) => key.column !== column)
}

/**
 * A different query is a different set of rows: the selection was made on the
 * old one and is dropped, rather than silently acting on rows no longer shown.
 */
function withQuery(state: GridState, query: GridQuery): GridState {
  if (queryKey(query) === queryKey(state.query)) return state.query === query ? state : { ...state, query }
  // The active cell goes back to the first row: its old row is somewhere else now.
  const focus = state.focus === null ? null : { row: Math.min(state.focus.row, 0), column: state.focus.column }
  // An edit, an open row and a menu all point at rows by their place in the
  // old answer, so they close with it. Saves stay: they are keyed by row.
  return { ...state, query, selection: emptySelection, anchor: null, focus, editing: null, detail: null, menu: null }
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** The open detail follows the active row, so arrow keys in the grid walk through it. */
const withFocus = (state: GridState, focus: { row: number; column: number }): GridState => ({
  ...state,
  focus,
  detail: state.detail !== null && focus.row >= 0 ? focus.row : state.detail,
})

const withoutSave = (saves: GridState['saves'], cell: string) => {
  if (!(cell in saves)) return saves
  const next = { ...saves }
  delete next[cell]
  return next
}

export function gridReducer(state: GridState, event: GridEvent): GridState {
  switch (event.type) {
    case 'SORT':
      return withQuery(state, { ...state.query, sort: nextSort(state.query.sort, event.column, Boolean(event.additive)) })
    case 'SET_SORT':
      return withQuery(state, { ...state.query, sort: event.sort })
    case 'SET_FILTER':
      return withQuery(state, {
        ...state.query,
        filters: [...state.query.filters.filter((filter) => filter.column !== event.filter.column), event.filter],
      })
    case 'CLEAR_FILTER':
      if (!state.query.filters.some((filter) => filter.column === event.column)) return state
      return withQuery(state, { ...state.query, filters: state.query.filters.filter((filter) => filter.column !== event.column) })
    case 'CLEAR_FILTERS':
      if (state.query.filters.length === 0 && state.query.search === '') return state
      return withQuery(state, { ...state.query, filters: [], search: '' })
    case 'SET_SEARCH':
      return withQuery(state, { ...state.query, search: event.search })
    case 'SET_QUERY':
      return withQuery(state, event.query)

    case 'RESIZE': {
      const column = state.columns.find((candidate) => candidate.id === event.column)
      if (!column) return state
      const width = clamp(Math.round(event.width), column.minWidth, column.maxWidth)
      if (width === column.width) return state
      return { ...state, columns: state.columns.map((candidate) => (candidate === column ? { ...candidate, width } : candidate)) }
    }
    case 'SET_HIDDEN': {
      const column = state.columns.find((candidate) => candidate.id === event.column)
      if (!column || column.hidden === event.hidden) return state
      // The last visible column stays: a grid with no columns cannot be got back from.
      if (event.hidden && state.columns.filter((candidate) => !candidate.hidden).length <= 1) return state
      return { ...state, columns: state.columns.map((candidate) => (candidate === column ? { ...candidate, hidden: event.hidden } : candidate)) }
    }
    case 'MOVE': {
      const from = state.columns.findIndex((candidate) => candidate.id === event.column)
      if (from === -1) return state
      const to = clamp(event.to, 0, state.columns.length - 1)
      if (to === from) return state
      const columns = state.columns.slice()
      const [moved] = columns.splice(from, 1)
      columns.splice(to, 0, moved)
      return { ...state, columns }
    }
    case 'PIN': {
      const column = state.columns.find((candidate) => candidate.id === event.column)
      if (!column || column.pinned === event.pinned) return state
      return { ...state, columns: state.columns.map((candidate) => (candidate === column ? { ...candidate, pinned: event.pinned } : candidate)) }
    }
    case 'SET_COLUMNS':
      return { ...state, columns: event.columns }

    case 'FOCUS':
      if (state.focus?.row === event.row && state.focus.column === event.column) return state
      return withFocus(state, { row: event.row, column: event.column })
    case 'BLUR':
      return state.focus === null ? state : { ...state, focus: null }
    case 'TOGGLE':
      return withFocus(
        { ...state, selection: toggleKey(state.selection, event.key), anchor: event.index },
        { row: event.index, column: state.focus?.column ?? 0 }
      )
    case 'SELECT_RANGE':
      return withFocus({ ...state, selection: setKeys(state.selection, event.keys, true) }, { row: event.index, column: state.focus?.column ?? 0 })
    case 'SELECT_ALL_MATCHING':
      return { ...state, selection: selectAllMatching(), anchor: null }
    case 'CLEAR_SELECTION':
      if (state.selection.mode === 'keys' && state.selection.keys.size === 0) return state
      return { ...state, selection: emptySelection, anchor: null }

    case 'EDIT_START':
      return {
        ...withFocus(state, { row: event.row, column: event.column }),
        editing: { row: event.row, column: event.column, draft: event.draft },
        notice: null,
      }
    case 'EDIT_DRAFT':
      // Typing again takes the complaint away: it was about the old text.
      return state.editing ? { ...state, editing: { row: state.editing.row, column: state.editing.column, draft: event.draft } } : state
    case 'EDIT_ERROR':
      return state.editing ? { ...state, editing: { ...state.editing, error: event.error } } : state
    case 'EDIT_END':
      return state.editing ? { ...state, editing: null } : state
    case 'SAVE_START':
      return { ...state, saves: { ...state.saves, [event.cell]: { status: 'saving' } } }
    case 'SAVE_DONE':
      return { ...state, saves: withoutSave(state.saves, event.cell) }
    case 'SAVE_FAILED':
      return {
        ...state,
        saves: { ...state.saves, [event.cell]: { status: 'failed', message: event.message, column: event.column } },
        notice: { column: event.column, message: event.message },
      }

    case 'OPEN_DETAIL':
      return { ...state, detail: event.row, focus: { row: event.row, column: state.focus?.column ?? 0 } }
    case 'CLOSE_DETAIL':
      return state.detail === null ? state : { ...state, detail: null }
    case 'REQUEST_MENU':
      return {
        ...withFocus(state, { row: event.row, column: event.column }),
        menu: { row: event.row, column: event.column, point: event.point, nonce: (state.menu?.nonce ?? 0) + 1 },
      }
  }
}

/** Visible columns, the pinned-to-start first and the pinned-to-end last, each group in its own order. */
export function visibleColumns(columns: readonly ColumnState[]): ColumnState[] {
  const shown = columns.filter((column) => !column.hidden)
  return [
    ...shown.filter((column) => column.pinned === 'start'),
    ...shown.filter((column) => !column.pinned),
    ...shown.filter((column) => column.pinned === 'end'),
  ]
}
