import type { IconName } from '@ggary/icons'
import type { Dict, Normalizer } from '../../types'
import { sortEntries } from './table.machine'
import { tableAnatomy } from './table.anatomy'
import type { TableAlign, TableColumnDef, TableEvent, TableRowKey, TableSort, TableState, TableWords } from './table.types'

export interface TableConnectOptions<Row = any> {
  /** Read above the table by a screen reader, and shown there. Without it, `label` names the table. */
  caption?: string
  /** The table's accessible name when it carries no caption. */
  label?: string
  /** Reads the cell's key. Defaults to the position: "Row 1". */
  rowName?: (row: Row, index: number) => string
  /** A sort button's name, given the column and where it stands. */
  sortLabel?: (header: string, direction: TableSort['direction'] | null) => string
  words?: TableWords
}

const textOf = (value: unknown): string => (value === null || value === undefined ? '' : String(value))

const alignOf = <Row,>(column: TableColumnDef<Row>, row: Row): TableAlign => {
  if (column.align) return column.align
  const value = column.value ? column.value(row) : (row as Record<string, unknown>)[column.id]
  return typeof value === 'number' ? 'end' : 'start'
}

export interface TableRowEntry<Row = any> {
  row: Row
  key: TableRowKey
  /** The position in reading order — after the sort, when one stands. */
  index: number
  selected: boolean
}

/**
 * A regular table over native elements: `th` names its column with `scope`,
 * a sortable one carries `aria-sort` and a button, chosen rows are said with
 * `data-selected`. Sorting and selection are the machine's; what a cell shows
 * is the adapter's — core never renders markup.
 */
export function connect<Row = any, T = Dict>(
  state: TableState<Row>,
  send: (event: TableEvent<Row>) => void,
  normalize: Normalizer<T>,
  options: TableConnectOptions<Row> = {}
) {
  const {
    caption,
    label,
    rowName = (row: Row, index: number) => `Row ${index + 1}`,
    sortLabel = (header: string, direction: TableSort['direction'] | null) =>
      direction === null
        ? `Sort by ${header}`
        : direction === 'asc'
          ? `${header}, sorted ascending. Activate to sort descending.`
          : `${header}, sorted descending. Activate to clear sorting.`,
    words = {},
  } = options

  const entries: TableRowEntry<Row>[] = sortEntries(state.rows, state.columns, state.sort).map(({ row, index }) => {
    const key = state.getRowKey(row, index)
    return { row, key, index, selected: state.selection.includes(key) }
  })

  const keys = entries.map((entry) => entry.key)
  const allSelected = keys.length > 0 && keys.every((key) => state.selection.includes(key))
  const someSelected = keys.some((key) => state.selection.includes(key))
  const span = state.columns.length + (state.selectable ? 1 : 0)

  const sortable = (column: TableColumnDef<Row>) => column.sortable !== false
  const directionOf = (column: TableColumnDef<Row>): TableSort['direction'] | null =>
    state.sort?.column === column.id ? state.sort.direction : null

  return {
    ids: { root: state.id },
    sort: state.sort,
    selection: state.selection,
    entries,
    allSelected,
    someSelected,

    toggleSort: (column: string) => send({ type: 'SORT', column }),
    toggleRow: (key: TableRowKey) => send({ type: 'SELECT_ROW', key }),
    toggleAll: () => send({ type: 'SELECT_ALL' }),

    rootProps: normalize({
      ...tableAnatomy.attrs('root'),
      id: state.id,
      'aria-label': caption === undefined ? label : undefined,
    }),

    captionProps: normalize({ ...tableAnatomy.attrs('caption') }),

    headerProps: normalize({ ...tableAnatomy.attrs('header') }),
    headerRowProps: normalize({ ...tableAnatomy.attrs('header-row') }),
    bodyProps: normalize({ ...tableAnatomy.attrs('body') }),
    getHeaderCellProps: (column: TableColumnDef<Row>) => {
      const direction = directionOf(column)
      return normalize({
        ...tableAnatomy.attrs('header-cell'),
        scope: 'col',
        'aria-sort': sortable(column) ? (direction === null ? 'none' : direction === 'asc' ? 'ascending' : 'descending') : undefined,
        'data-align': column.align ?? 'start',
        'data-sortable': sortable(column) ? '' : undefined,
        style: column.width ? { width: column.width } : undefined,
      })
    },

    getSortButtonProps: (column: TableColumnDef<Row>) => {
      const direction = directionOf(column)
      return normalize({
        ...tableAnatomy.attrs('sort'),
        type: 'button',
        'aria-label': sortLabel(column.header, direction),
        'data-state': direction ?? 'none',
        onClick: () => send({ type: 'SORT', column: column.id }),
      })
    },

    getSortIconProps: (column: TableColumnDef<Row>) => {
      const direction = directionOf(column)
      const icon: IconName =
        direction === 'asc' ? 'arrow-up' : direction === 'desc' ? 'arrow-down' : 'sort'
      return normalize({ ...tableAnatomy.attrs('sort-icon'), 'data-icon': icon, 'aria-hidden': 'true' })
    },

    /** The header cell of the checkbox column. The box inside chooses every shown row. */    selectHeaderCellProps: normalize({
      ...tableAnatomy.attrs('header-cell'),
      scope: 'col',
      'data-select': '',
    }),

    selectAllCheckboxProps: () =>
      normalize({
        checked: allSelected ? true : someSelected ? ('indeterminate' as const) : false,
        onCheckedChange: () => send({ type: 'SELECT_ALL' }),
        'aria-label': words.selectAll ?? 'Select all rows',
      }),

    getRowProps: (entry: TableRowEntry<Row>) =>
      normalize({
        ...tableAnatomy.attrs('row'),
        'data-key': String(entry.key),
        'data-selected': entry.selected ? '' : undefined,
      }),

    getCellProps: (column: TableColumnDef<Row>, entry: TableRowEntry<Row>) =>
      normalize({
        ...tableAnatomy.attrs('cell'),
        'data-align': alignOf(column, entry.row),
      }),

    /** The body cell holding a row's box. */
    getSelectCellProps: (entry: TableRowEntry<Row>) =>
      normalize({
        ...tableAnatomy.attrs('cell'),
        'data-select': '',
        'data-selected': entry.selected ? '' : undefined,
      }),

    getRowCheckboxProps: (entry: TableRowEntry<Row>) =>
      normalize({
        checked: entry.selected,
        onCheckedChange: () => send({ type: 'SELECT_ROW', key: entry.key }),
        'aria-label': `Select ${rowName(entry.row, entry.index)}`,
      }),

    emptyRowProps: normalize({ ...tableAnatomy.attrs('row'), 'data-empty': '' }),
    emptyCellProps: (colSpan: number = span) =>
      normalize({ ...tableAnatomy.attrs('cell'), colSpan }),
    emptyProps: normalize({ ...tableAnatomy.attrs('empty') }),
    /** Every word resolved to its English default: adapters composing their own markup read here. */
    texts: { empty: words.empty ?? 'No rows', selectAll: words.selectAll ?? 'Select all rows' },
    rowNameOf: (entry: TableRowEntry<Row>) => rowName(entry.row, entry.index),
  }
}

export type TableApi<Row = any, T = Dict> = ReturnType<typeof connect<Row, T>>
export { textOf }
