import { createMachine, type Machine } from '../../machine'
import { createGridData, type GridData, type GridDataState } from './data-grid.loader'
import { gridReducer, initialColumns, initialGridState, visibleColumns, type GridEvent, type GridState } from './data-grid.machine'
import { queryKey } from './data-grid.query'
import { isSelected, selectedCount } from './data-grid.selection'
import type { ColumnDef, ColumnState, GridQuery, GridSource, RowKey, Selection } from './data-grid.types'
import { rowWindow, scrollTopForRow, type RowWindow } from './data-grid.viewport'

/**
 * The grid, minus the drawing. One object per grid that joins the three pure
 * parts — the state reducer, the block loader and the viewport arithmetic — to
 * the one DOM element they need, the scrolling one: it listens to its scroll
 * and its size, owns the keyboard, and tells the adapters what to draw.
 *
 * The keyboard model is the grid pattern's, with the focus kept on the grid
 * element itself and the active cell named by aria-activedescendant. Rows are
 * recycled as they scroll; a focus that lived on a row would be dropped with
 * it, and this way there is nothing to drop.
 */

export interface DataGridOptions<Row> {
  columns: ColumnDef<Row>[]
  source: GridSource<Row>
  /** A key that stays with the row across queries: an id, never an index. */
  rowKey: (row: Row) => RowKey
  query?: Partial<GridQuery>
  /** A checkbox column, Shift ranges and "select all matching". */
  selectable?: boolean
  /** One height for every row. Read from the theme's --gg-grid-row-height when omitted. */
  rowHeight?: number
  blockSize?: number
  maxBlocks?: number
  overscan?: number
  onQueryChange?: (query: GridQuery) => void
  onSelectionChange?: (selection: Selection) => void
  /** Enter or a double click on a row: open it. */
  onRowActivate?: (row: Row, index: number) => void
}

export interface GridViewport {
  scrollTop: number
  /** The height rows are drawn in: the grid's height less its header. */
  height: number
  rowHeight: number
  /** The measured header row, for what is placed under it. */
  headerHeight: number
  window: RowWindow
}

export interface DataGridSnapshot {
  grid: GridState
  data: GridDataState
  viewport: GridViewport
}

export interface DataGridController<Row> {
  readonly machine: Machine<GridState, GridEvent>
  readonly data: GridData<Row>
  readonly options: DataGridOptions<Row>
  getSnapshot(): DataGridSnapshot
  subscribe(listener: () => void): () => void
  send(event: GridEvent): void
  /** Start listening to the scrolling element; returns the way to stop. */
  attach(scroller: HTMLElement): () => void
  /** New columns or a new source from the owner. Columns keep their widths by id. */
  update(options: Partial<Pick<DataGridOptions<Row>, 'columns' | 'source' | 'onQueryChange' | 'onSelectionChange' | 'onRowActivate' | 'rowKey'>>): void
  /** A pointer press on a cell; the modifiers decide what it selects. */
  press(row: number, column: number, event: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean; detail?: number }): void
  /** The checkbox of a row, or of the header (row -1). */
  check(row: number, event?: { shiftKey: boolean }): void
  scrollToRow(index: number, align?: 'start' | 'end' | 'nearest'): void
  /** The visible columns, with the checkbox column first when there is one. */
  layout(): GridLayout
  destroy(): void
}

export const SELECT_COLUMN = '__select'
export const SELECT_WIDTH = 44

export interface LaidColumn {
  state: ColumnState
  /** Undefined for the checkbox column. */
  def: ColumnDef | undefined
  /** Distance from the grid's start edge, for a pinned-start column. */
  start?: number
  /** Distance from the grid's end edge, for a pinned-end column. */
  end?: number
}

export interface GridLayout {
  columns: LaidColumn[]
  width: number
}

const readRowHeight = (element: HTMLElement) => {
  const value = parseFloat(getComputedStyle(element).getPropertyValue('--gg-grid-row-height'))
  return Number.isFinite(value) && value > 0 ? value : 32
}

export function createDataGrid<Row>(initialOptions: DataGridOptions<Row>): DataGridController<Row> {
  let options = initialOptions
  const machine = createMachine(initialGridState(options.columns, options.query), gridReducer)
  let data = createGridData(options.source, machine.getState().query, {
    blockSize: options.blockSize,
    maxBlocks: options.maxBlocks,
  })

  let scroller: HTMLElement | null = null
  let headerHeight = 0
  let viewport: GridViewport = {
    scrollTop: 0,
    height: 0,
    rowHeight: options.rowHeight ?? 32,
    headerHeight: 0,
    window: { start: 0, end: 0, scrollHeight: 0, shift: 0, ratio: 1 },
  }
  const listeners = new Set<() => void>()
  let snapshot: DataGridSnapshot = { grid: machine.getState(), data: data.getState(), viewport }

  const emit = () => {
    snapshot = { grid: machine.getState(), data: data.getState(), viewport }
    for (const listener of listeners) listener()
  }

  /** Before the first answer the count is unknown: draw placeholders for a screenful. */
  const knownTotal = () => {
    const total = data.getState().total
    if (total !== undefined) return total
    return viewport.height > 0 ? Math.ceil(viewport.height / viewport.rowHeight) : 20
  }

  const recompute = () => {
    const next = rowWindow({
      scrollTop: viewport.scrollTop,
      viewportHeight: Math.max(1, viewport.height),
      rowHeight: viewport.rowHeight,
      total: knownTotal(),
      overscan: options.overscan,
    })
    const changed = next.start !== viewport.window.start || next.end !== viewport.window.end || next.scrollHeight !== viewport.window.scrollHeight || next.shift !== viewport.window.shift
    if (changed) viewport = { ...viewport, window: next }
    data.ensureRange({ start: next.start, end: Math.max(next.end, next.start + 1) })
    return changed
  }

  const layout = (): GridLayout => {
    const byId = new Map(options.columns.map((column) => [column.id, column]))
    const laid: LaidColumn[] = visibleColumns(machine.getState().columns).map((state) => ({ state, def: byId.get(state.id) }))
    if (options.selectable) {
      laid.unshift({
        state: { id: SELECT_COLUMN, width: SELECT_WIDTH, minWidth: SELECT_WIDTH, maxWidth: SELECT_WIDTH, hidden: false, pinned: 'start' },
        def: undefined,
      })
    }
    let start = 0
    for (const column of laid) {
      if (column.state.pinned !== 'start') break
      column.start = start
      start += column.state.width
    }
    let end = 0
    for (let i = laid.length - 1; i >= 0; i -= 1) {
      if (laid[i].state.pinned !== 'end') break
      laid[i].end = end
      end += laid[i].state.width
    }
    return { columns: laid, width: laid.reduce((sum, column) => sum + column.state.width, 0) }
  }

  const rowKeyAt = (index: number) => {
    const row = data.rowAt(index)
    return row === undefined ? undefined : options.rowKey(row)
  }

  /** The keys of the loaded rows between two indices, both included. */
  const keysBetween = (from: number, to: number) => {
    const keys: RowKey[] = []
    for (let i = Math.min(from, to); i <= Math.max(from, to); i += 1) {
      const key = rowKeyAt(i)
      if (key !== undefined) keys.push(key)
    }
    return keys
  }

  const scrollToRow = (index: number, align: 'start' | 'end' | 'nearest' = 'nearest') => {
    if (!scroller || index < 0) return
    const top = scrollTopForRow(index, {
      scrollTop: scroller.scrollTop,
      viewportHeight: Math.max(1, viewport.height),
      rowHeight: viewport.rowHeight,
      total: knownTotal(),
    }, align)
    if (top !== scroller.scrollTop) scroller.scrollTop = top
  }

  const moveFocus = (row: number, column: number) => {
    const total = data.getState().total ?? 0
    const columns = layout().columns.length
    const nextRow = Math.max(-1, Math.min(total - 1, row))
    const nextColumn = Math.max(0, Math.min(columns - 1, column))
    machine.send({ type: 'FOCUS', row: nextRow, column: nextColumn })
    if (nextRow >= 0) scrollToRow(nextRow)
  }

  const sortColumn = (column: number, additive: boolean) => {
    const laid = layout().columns[column]
    if (!laid?.def || laid.def.sortable === false) return
    machine.send({ type: 'SORT', column: laid.def.id, additive })
  }

  const check = (row: number, event: { shiftKey: boolean } = { shiftKey: false }) => {
    const state = machine.getState()
    if (row === -1) {
      const total = data.getState().total
      const count = selectedCount(state.selection, total) ?? 0
      machine.send({ type: count > 0 ? 'CLEAR_SELECTION' : 'SELECT_ALL_MATCHING' })
      return
    }
    const key = rowKeyAt(row)
    if (key === undefined) return
    if (event.shiftKey && state.anchor !== null) {
      machine.send({ type: 'SELECT_RANGE', keys: keysBetween(state.anchor, row), index: row })
    } else {
      machine.send({ type: 'TOGGLE', key, index: row })
    }
  }

  const activate = (row: number) => {
    const found = data.rowAt(row)
    if (found !== undefined) options.onRowActivate?.(found, row)
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.target !== scroller) return
    const state = machine.getState()
    const focus = state.focus ?? { row: data.getState().total ? 0 : -1, column: 0 }
    const page = Math.max(1, Math.floor(viewport.height / viewport.rowHeight) - 1)
    const lastColumn = layout().columns.length - 1
    const mod = event.ctrlKey || event.metaKey

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        const step = event.key === 'ArrowDown' ? 1 : -1
        const target = focus.row + step
        if (event.shiftKey && options.selectable && target >= 0 && focus.row >= 0) {
          // Shift extends the selection from the anchor, as in a file list.
          const anchor = state.anchor ?? focus.row
          if (state.anchor === null) {
            const key = rowKeyAt(focus.row)
            if (key !== undefined && !isSelected(state.selection, key)) machine.send({ type: 'TOGGLE', key, index: focus.row })
          }
          machine.send({ type: 'SELECT_RANGE', keys: keysBetween(anchor, target), index: target })
          scrollToRow(target)
        } else {
          moveFocus(target, focus.column)
        }
        break
      }
      case 'PageDown':
        moveFocus(Math.max(0, focus.row) + page, focus.column)
        break
      case 'PageUp':
        moveFocus(Math.max(0, focus.row - page), focus.column)
        break
      case 'ArrowRight':
        moveFocus(focus.row, focus.column + 1)
        break
      case 'ArrowLeft':
        moveFocus(focus.row, focus.column - 1)
        break
      case 'Home':
        if (mod) moveFocus(0, focus.column)
        else moveFocus(focus.row, 0)
        break
      case 'End':
        if (mod) moveFocus((data.getState().total ?? 1) - 1, focus.column)
        else moveFocus(focus.row, lastColumn)
        break
      case ' ':
      case 'Spacebar':
        if (focus.row === -1) sortColumn(focus.column, event.shiftKey)
        else if (options.selectable) check(focus.row, { shiftKey: event.shiftKey })
        else return
        break
      case 'Enter':
        if (focus.row === -1) sortColumn(focus.column, event.shiftKey)
        else activate(focus.row)
        break
      case 'a':
      case 'A':
        if (!mod || !options.selectable) return
        machine.send({ type: 'SELECT_ALL_MATCHING' })
        break
      case 'Escape':
        if (!options.selectable || (selectedCount(state.selection, data.getState().total) ?? 0) === 0) return
        machine.send({ type: 'CLEAR_SELECTION' })
        break
      default:
        // Alt+Left/Right on a header cell resizes its column — the keyboard's
        // way to do what the drag handle does.
        return
    }
    event.preventDefault()
    if (!state.focus) machine.send({ type: 'FOCUS', row: machine.getState().focus?.row ?? focus.row, column: focus.column })
  }

  const onResizeKey = (event: KeyboardEvent) => {
    if (event.target !== scroller || !event.altKey || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return
    const focus = machine.getState().focus
    if (!focus || focus.row !== -1) return
    const laid = layout().columns[focus.column]
    if (!laid?.def) return
    machine.send({ type: 'RESIZE', column: laid.def.id, width: laid.state.width + (event.key === 'ArrowRight' ? 16 : -16) })
    event.preventDefault()
    event.stopImmediatePropagation()
  }

  let previous = machine.getState()
  const unsubscribeMachine = machine.subscribe((next) => {
    if (queryKey(next.query) !== queryKey(previous.query)) {
      data.setQuery(next.query)
      // A new question starts at the top of its answer.
      if (scroller) scroller.scrollTop = 0
      viewport = { ...viewport, scrollTop: 0 }
      recompute()
      options.onQueryChange?.(next.query)
    }
    if (next.selection !== previous.selection) options.onSelectionChange?.(next.selection)
    previous = next
    emit()
  })

  const followData = () => {
    recompute()
    emit()
  }
  let unsubscribeData = data.subscribe(followData)

  const controller: DataGridController<Row> = {
    machine,
    get data() {
      return data
    },
    get options() {
      return options
    },
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    send: (event) => machine.send(event),

    attach(element) {
      scroller = element
      if (options.rowHeight === undefined) viewport = { ...viewport, rowHeight: readRowHeight(element) }

      const measure = () => {
        const header = element.querySelector<HTMLElement>(':scope > [data-part="header"]')
        headerHeight = header?.offsetHeight ?? 0
        if (options.rowHeight === undefined) viewport = { ...viewport, rowHeight: readRowHeight(element) }
        viewport = { ...viewport, headerHeight, height: Math.max(0, element.clientHeight - headerHeight), scrollTop: element.scrollTop }
        recompute()
        emit()
      }
      const onScroll = () => {
        if (element.scrollTop === viewport.scrollTop) return
        viewport = { ...viewport, scrollTop: element.scrollTop }
        if (recompute()) emit()
      }
      const onFocus = (event: FocusEvent) => {
        if (event.target === element && !machine.getState().focus) {
          machine.send({ type: 'FOCUS', row: data.getState().total ? 0 : -1, column: 0 })
        }
      }

      const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
      observer?.observe(element)
      element.addEventListener('scroll', onScroll, { passive: true })
      element.addEventListener('keydown', onResizeKey)
      element.addEventListener('keydown', onKeyDown)
      element.addEventListener('focus', onFocus)
      measure()

      return () => {
        // Leaving the page aborts what is in flight; coming back asks again.
        data.cancel()
        observer?.disconnect()
        element.removeEventListener('scroll', onScroll)
        element.removeEventListener('keydown', onResizeKey)
        element.removeEventListener('keydown', onKeyDown)
        element.removeEventListener('focus', onFocus)
        if (scroller === element) scroller = null
      }
    },

    update(next) {
      const sourceChanged = next.source !== undefined && next.source !== options.source
      const columnsChanged = next.columns !== undefined && next.columns !== options.columns
      options = { ...options, ...next }
      if (columnsChanged) {
        const current = new Map(machine.getState().columns.map((column) => [column.id, column]))
        machine.send({
          type: 'SET_COLUMNS',
          columns: initialColumns(options.columns).map((column) => {
            const kept = current.get(column.id)
            return kept ? { ...column, width: kept.width, hidden: kept.hidden, pinned: kept.pinned } : column
          }),
        })
      }
      if (sourceChanged) {
        unsubscribeData()
        data.destroy()
        data = createGridData(options.source, machine.getState().query, { blockSize: options.blockSize, maxBlocks: options.maxBlocks })
        unsubscribeData = data.subscribe(followData)
        recompute()
        emit()
      }
    },

    press(row, column, event) {
      if (event.detail === 2 && row >= 0) {
        activate(row)
        return
      }
      if (row >= 0 && options.selectable && (event.shiftKey || event.ctrlKey || event.metaKey)) {
        machine.send({ type: 'FOCUS', row, column })
        check(row, { shiftKey: event.shiftKey })
        return
      }
      machine.send({ type: 'FOCUS', row, column })
      if (row === -1) sortColumn(column, event.shiftKey)
      scroller?.focus({ preventScroll: true })
    },

    check,
    scrollToRow,
    layout,

    destroy() {
      unsubscribeMachine()
      unsubscribeData()
      data.destroy()
      listeners.clear()
    },
  }
  return controller
}
