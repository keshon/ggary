import { createAnatomy, type Dict, type Normalizer } from '../../types'
import type { DataGridController, DataGridSnapshot } from './data-grid.controller'
import { describeFilter, filterableColumns, filterFromDraft, type FilterDraft, type FilterWords } from './data-grid.filters'
import { initialColumns } from './data-grid.machine'
import { selectedCount, selectionPayload } from './data-grid.selection'
import type { ColumnDef, GridQuery } from './data-grid.types'

/**
 * The working surface around a grid: the filters in force, what is selected
 * and what can be done with it, and which columns are shown. Each reads the
 * grid's controller and sends it events; none holds state of its own, so two
 * of them — or a keyboard shortcut — can never disagree about the grid.
 */

export const gridFiltersAnatomy = createAnatomy('grid-filters', [
  'root',
  'chip',
  'chip-button',
  'chip-name',
  'chip-value',
  'chip-remove',
  'chip-remove-icon',
  'editor',
  'editor-fields',
  'editor-actions',
] as const)

export const gridBulkAnatomy = createAnatomy('grid-bulk', ['root', 'count', 'select-all', 'clear', 'actions'] as const)

export const gridColumnsAnatomy = createAnatomy('grid-columns', ['root', 'reset'] as const)

export interface GridView {
  id: string
  label: string
  /** Applied whole: a view replaces the sort, the filters and the search. */
  query: Partial<GridQuery>
}

export interface FilterBarWords extends FilterWords {
  label?: string
  remove?: (column: string) => string
}

/** The filters in force as chips, each one editable and removable. */
export function connectFilters<Row, T = Dict>(
  snapshot: DataGridSnapshot,
  controller: DataGridController<Row>,
  normalize: Normalizer<T>,
  words: FilterBarWords = {}
) {
  const columns = controller.options.columns as ColumnDef[]
  const byId = new Map(columns.map((column) => [column.id, column]))
  const { query } = snapshot.grid

  const chips = query.filters.flatMap((filter) => {
    const column = byId.get(filter.column)
    if (!column) return []
    const value = describeFilter(filter, column, words)
    return [
      {
        key: column.id,
        column,
        filter,
        name: column.header,
        value,
        rootProps: normalize({ ...gridFiltersAnatomy.attrs('chip'), 'data-kind': filter.kind }),
        buttonProps: normalize({ ...gridFiltersAnatomy.attrs('chip-button'), type: 'button' }),
        nameProps: normalize({ ...gridFiltersAnatomy.attrs('chip-name') }),
        valueProps: normalize({ ...gridFiltersAnatomy.attrs('chip-value') }),
        removeProps: normalize({
          ...gridFiltersAnatomy.attrs('chip-remove'),
          type: 'button',
          'aria-label': words.remove ? words.remove(column.header) : `Remove the filter on ${column.header}`,
          onClick: () => controller.send({ type: 'CLEAR_FILTER', column: column.id }),
        }),
        removeIconProps: normalize({ ...gridFiltersAnatomy.attrs('chip-remove-icon'), 'data-icon': 'close', 'aria-hidden': 'true' }),
      },
    ]
  })

  return {
    chips,
    columns: filterableColumns(columns),
    filterOf: (column: string) => query.filters.find((filter) => filter.column === column),
    hasFilters: query.filters.length > 0 || query.search.trim() !== '',
    /** Apply what an editor holds; an empty draft clears the column's filter. */
    apply(column: ColumnDef, draft: FilterDraft) {
      const filter = filterFromDraft(column, draft)
      controller.send(filter ? { type: 'SET_FILTER', filter } : { type: 'CLEAR_FILTER', column: column.id })
    },
    applyView(view: GridView) {
      controller.send({ type: 'SET_QUERY', query: { sort: [], filters: [], search: '', ...view.query } })
    },
    clear: () => controller.send({ type: 'CLEAR_FILTERS' }),
    rootProps: normalize({ ...gridFiltersAnatomy.attrs('root'), role: 'group', 'aria-label': words.label ?? 'Filters' }),
    editorProps: normalize({ ...gridFiltersAnatomy.attrs('editor') }),
    editorFieldsProps: normalize({ ...gridFiltersAnatomy.attrs('editor-fields') }),
    editorActionsProps: normalize({ ...gridFiltersAnatomy.attrs('editor-actions') }),
  }
}

export interface BulkWords {
  locale?: string
  label?: string
  selected?: (count: string) => string
  selectAll?: (total: string) => string
  allSelected?: (total: string) => string
  clear?: string
}

/**
 * What is selected, and the offer to make it everything the query matches —
 * the offer is the point: the registry's "all in the filter" meant the 100
 * rows on screen.
 */
export function connectBulk<Row, T = Dict>(
  snapshot: DataGridSnapshot,
  controller: DataGridController<Row>,
  normalize: Normalizer<T>,
  words: BulkWords = {}
) {
  const { selection, query } = snapshot.grid
  const total = snapshot.data.total
  const count = selectedCount(selection, total) ?? 0
  const number = (n: number) => n.toLocaleString(words.locale)
  const all = selection.mode === 'matching'
  const offer = !all && total !== undefined && total > count

  return {
    visible: count > 0,
    count,
    all,
    offer,
    countText: all
      ? (words.allSelected ?? ((n) => `All ${n} selected`))(number(count))
      : (words.selected ?? ((n) => `${n} selected`))(number(count)),
    selectAllText: offer ? (words.selectAll ?? ((n) => `Select all ${n}`))(number(total!)) : '',
    clearText: words.clear ?? 'Clear selection',
    /** For the action: keys, or the query and its exceptions. */
    payload: () => selectionPayload(selection, query),
    rootProps: normalize({ ...gridBulkAnatomy.attrs('root'), role: 'region', 'aria-label': words.label ?? 'Selection' }),
    countProps: normalize({ ...gridBulkAnatomy.attrs('count'), role: 'status' }),
    selectAllProps: normalize({
      ...gridBulkAnatomy.attrs('select-all'),
      type: 'button',
      onClick: () => controller.send({ type: 'SELECT_ALL_MATCHING' }),
    }),
    clearProps: normalize({
      ...gridBulkAnatomy.attrs('clear'),
      type: 'button',
      onClick: () => controller.send({ type: 'CLEAR_SELECTION' }),
    }),
    actionsProps: normalize({ ...gridBulkAnatomy.attrs('actions') }),
  }
}

/** Which columns are shown, as a checkbox group's items and value. */
export function connectColumns<Row, T = Dict>(snapshot: DataGridSnapshot, controller: DataGridController<Row>, normalize: Normalizer<T>) {
  const defs = new Map((controller.options.columns as ColumnDef[]).map((column) => [column.id, column]))
  const states = snapshot.grid.columns
  const visible = states.filter((column) => !column.hidden).map((column) => column.id)

  return {
    items: states.map((column) => ({
      value: column.id,
      label: defs.get(column.id)?.header ?? column.id,
      // The last one shown stays: a grid with no columns cannot be got back from.
      disabled: !column.hidden && visible.length === 1,
    })),
    value: visible,
    setVisible(next: readonly string[]) {
      for (const column of states) {
        const hidden = !next.includes(column.id)
        if (hidden !== column.hidden) controller.send({ type: 'SET_HIDDEN', column: column.id, hidden })
      }
    },
    reset() {
      controller.send({ type: 'SET_COLUMNS', columns: initialColumns(controller.options.columns as ColumnDef[]) })
    },
    rootProps: normalize({ ...gridColumnsAnatomy.attrs('root') }),
    resetProps: normalize({ ...gridColumnsAnatomy.attrs('reset') }),
  }
}
