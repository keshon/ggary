import type { Dict, Normalizer } from '../../types'
import { dataGridAnatomy } from './data-grid.anatomy'
import { SELECT_COLUMN, type DataGridController, type DataGridSnapshot, type LaidColumn } from './data-grid.controller'
import { alignOf, createFormatter, type FormatOptions } from './data-grid.format'
import { cellKey, editorKindOf, editorOptions, isEditable, type EditorKind } from './data-grid.edit'
import { cellValue } from './data-grid.query'
import { isAllSelected, isSelected, selectedCount } from './data-grid.selection'
import type { ColumnDef } from './data-grid.types'

export interface DataGridConnectOptions extends FormatOptions {
  id: string
  /** The grid's name: every grid on a page needs one. */
  label: string
  /** Said when the query matches nothing. */
  emptyText?: string
  /** Said when a request failed. */
  errorText?: string
  /** "3 selected"; receives the count. */
  selectedText?: (count: number) => string
  /** "12,400 rows"; receives the total. */
  totalText?: (total: number) => string
  selectAllLabel?: string
  selectRowLabel?: string
  /** The button that opens a row, in its first column: "Open". */
  openRowLabel?: string
  /** "Could not save Paid: the deal is closed"; receives the column's header and the reason. */
  saveFailedText?: (column: string, message: string) => string
}

export interface CellEditor<T> {
  kind: EditorKind
  /** A select editor's choices; the draft is the chosen one's `value`. */
  options: { value: string; label: string }[]
  /** An input, or a select for `kind: 'select'`. */
  inputProps: T
  /** Why the draft cannot be saved, or undefined. */
  error: string | undefined
  errorProps: T
}

const formatters = new WeakMap<ColumnDef, (value: unknown) => string>()
const formatterFor = (def: ColumnDef, options: FormatOptions) => {
  let format = formatters.get(def)
  if (!format) {
    format = createFormatter(def, options)
    formatters.set(def, format)
  }
  return format
}

const ARIA_SORT = { asc: 'ascending', desc: 'descending' } as const

export function connect<Row, T = Dict>(
  snapshot: DataGridSnapshot,
  controller: DataGridController<Row>,
  normalize: Normalizer<T>,
  options: DataGridConnectOptions
) {
  const { grid, data, viewport } = snapshot
  const { id, label } = options
  const selectable = Boolean(controller.options.selectable)
  const layout = controller.layout()
  const total = data.total
  const count = selectedCount(grid.selection, total) ?? 0
  const all = isAllSelected(grid.selection, total)
  const focus = grid.focus
  const { start, end, scrollHeight, shift } = viewport.window
  const rendered = (row: number) => row === -1 || (row >= start && row < end)

  const cellId = (row: number, column: number) => (row === -1 ? `${id}-h${column}` : `${id}-r${row}c${column}`)
  const activeId = focus && rendered(focus.row) ? cellId(focus.row, focus.column) : undefined

  const placement = (column: LaidColumn): Dict => ({
    width: `${column.state.width}px`,
    'inset-inline-start': column.start !== undefined ? `${column.start}px` : undefined,
    'inset-inline-end': column.end !== undefined ? `${column.end}px` : undefined,
  })
  const pinAttrs = (column: LaidColumn) => ({
    'data-pinned': column.state.pinned,
    // The last pinned-start column draws the edge the rest scroll under.
    'data-pin-edge':
      (column.start !== undefined && !layout.columns.some((other) => other.start !== undefined && other.start > column.start!)) ||
      (column.end !== undefined && !layout.columns.some((other) => other.end !== undefined && other.end > column.end!))
        ? ''
        : undefined,
  })

  const primary = grid.query.sort[0]

  const headerCells = layout.columns.map((column, index) => {
    const def = column.def
    const isSelect = column.state.id === SELECT_COLUMN
    const sortKey = def ? grid.query.sort.findIndex((key) => key.column === def.id) : -1
    const sort = sortKey === -1 ? undefined : grid.query.sort[sortKey]
    const sortable = Boolean(def && def.sortable !== false)
    const focused = focus?.row === -1 && focus.column === index

    const onResizeStart = (event: PointerEvent) => {
      if (!def) return
      event.preventDefault()
      event.stopPropagation()
      const handle = event.currentTarget as HTMLElement
      const startX = event.clientX
      const startWidth = column.state.width
      // In a right-to-left grid the column grows as the pointer moves left.
      const direction = getComputedStyle(handle).direction === 'rtl' ? -1 : 1
      try {
        handle.setPointerCapture(event.pointerId)
      } catch {
        // A synthetic pointer has nothing to capture.
      }
      const onMove = (move: PointerEvent) =>
        controller.send({ type: 'RESIZE', column: def.id, width: startWidth + (move.clientX - startX) * direction })
      const onUp = () => {
        handle.removeEventListener('pointermove', onMove)
        handle.removeEventListener('pointerup', onUp)
        handle.removeEventListener('pointercancel', onUp)
      }
      handle.addEventListener('pointermove', onMove)
      handle.addEventListener('pointerup', onUp)
      handle.addEventListener('pointercancel', onUp)
    }

    return {
      key: column.state.id,
      column,
      isSelect,
      label: def?.header ?? '',
      sortable,
      sort: sort?.direction,
      props: normalize({
        ...dataGridAnatomy.attrs('header-cell'),
        id: cellId(-1, index),
        role: 'columnheader',
        'aria-colindex': index + 1,
        // Only the first sort key: ARIA asks for one sorted header at a time.
        'aria-sort': sort && primary?.column === def?.id ? ARIA_SORT[sort.direction] : undefined,
        'data-align': def ? alignOf(def) : 'center',
        'data-sortable': sortable ? '' : undefined,
        'data-sorted': sort?.direction,
        'data-sort-order': sort && grid.query.sort.length > 1 ? sortKey + 1 : undefined,
        'data-focused': focused ? '' : undefined,
        'data-select': isSelect ? '' : undefined,
        ...pinAttrs(column),
        title: def?.description,
        style: placement(column),
        onClick: (event: MouseEvent) =>
          controller.press(-1, index, { shiftKey: event.shiftKey, ctrlKey: event.ctrlKey, metaKey: event.metaKey }),
      }),
      labelProps: normalize({ ...dataGridAnatomy.attrs('header-label') }),
      sortProps: normalize({
        ...dataGridAnatomy.attrs('sort'),
        'aria-hidden': 'true',
        'data-icon': 'chevron-down',
        'data-direction': sort?.direction,
      }),
      resizeProps: normalize({
        ...dataGridAnatomy.attrs('resize'),
        // A drag handle for the pointer; the keyboard resizes with Alt+Arrow.
        'aria-hidden': 'true',
        onPointerDown: onResizeStart,
        onClick: (event: MouseEvent) => event.stopPropagation(),
      }),
      checkboxProps: normalize({
        ...dataGridAnatomy.attrs('checkbox'),
        type: 'checkbox',
        tabIndex: -1,
        'aria-label': options.selectAllLabel ?? 'Select all matching rows',
        checked: all,
        'data-state': all ? 'checked' : count > 0 ? 'indeterminate' : 'unchecked',
        onClick: (event: MouseEvent) => {
          // The grid owns the state: a press asks for a change, and the box is
          // then set to what the grid decided. Not cancelled — a cancelled
          // click is undone by the browser after every handler has run, which
          // would put back the box a renderer had just drawn.
          event.stopPropagation()
          controller.check(-1)
          const box = event.currentTarget as HTMLInputElement
          const now = controller.getSnapshot()
          const everything = isAllSelected(now.grid.selection, now.data.total)
          box.checked = everything
          box.indeterminate = !everything && (selectedCount(now.grid.selection, now.data.total) ?? 0) > 0
        },
        onChange: () => {},
      }),
      /** The in-between state is a property, not an attribute: adapters set it. */
      indeterminate: !all && count > 0,
      /** The box's mark: a check, or a dash while some rows but not all are chosen. */
      checkboxIndicatorProps: normalize({ ...dataGridAnatomy.attrs('checkbox-indicator'), 'aria-hidden': 'true', 'data-icon': !all && count > 0 ? 'minus' : 'check' }),
    }
  })

  const rows: {
    index: number
    key: string | number
    row: Row | undefined
    props: T
    cells: {
      key: string
      isSelect: boolean
      def: ColumnDef | undefined
      value: unknown
      text: string
      props: T
      checkboxProps: T
      /**
       * The row's Open button, in its first column when a row opens — a detail
       * sheet is there, or `onRowActivate` — and it is not being edited. Null elsewhere.
       */
      openProps: T | null
      /** Present while this cell is being edited: draw the editor instead of the text. */
      editor: CellEditor<T> | undefined
    }[]
  }[] = []

  // A row opens from its first column's Open button when there is something to open it into.
  const firstData = layout.columns.findIndex((column) => column.state.id !== SELECT_COLUMN)
  const opensRows = controller.provides('detail') || controller.options.onRowActivate !== undefined
  const openLabel = options.openRowLabel ?? 'Open'

  const editing = grid.editing
  const anyEditable = layout.columns.some((column) => column.def?.editable)
  // The row being edited is drawn even when it has scrolled out of view: its
  // editor holds the focus and a draft, and neither should be dropped.
  const indices: number[] = []
  if (editing && editing.row >= 0 && editing.row < start) indices.push(editing.row)
  for (let index = start; index < end; index += 1) indices.push(index)
  if (editing && editing.row >= end) indices.push(editing.row)

  const editorFor = (def: ColumnDef, index: number, columnIndex: number): CellEditor<T> => {
    const kind = editorKindOf(def)
    const errorId = `${cellId(index, columnIndex)}-error`
    const error = editing!.error
    return {
      kind,
      options: kind === 'select' ? editorOptions(def, { yes: options.yes, no: options.no }).map((option, i) => ({ value: String(i), label: option.label })) : [],
      error,
      inputProps: normalize({
        ...dataGridAnatomy.attrs('editor'),
        'data-kind': kind,
        type: kind === 'select' ? undefined : kind === 'date' ? 'date' : kind === 'datetime' ? 'datetime-local' : 'text',
        inputMode: kind === 'number' ? 'decimal' : undefined,
        autoComplete: 'off',
        value: editing!.draft,
        'aria-label': def.header,
        'aria-invalid': error ? 'true' : undefined,
        'aria-describedby': error ? errorId : undefined,
        onInput: (event: Event) => controller.setDraft((event.currentTarget as HTMLInputElement).value),
        onKeyDown: (event: KeyboardEvent) => {
          if (event.key === 'Enter' && !event.isComposing) {
            event.preventDefault()
            controller.commitEdit()
          } else if (event.key === 'Escape') {
            // The edit is what Escape undoes here, not a sheet or a dialog around the grid.
            event.preventDefault()
            event.stopPropagation()
            controller.cancelEdit()
          } else if (event.key === 'Tab') {
            event.preventDefault()
            controller.commitEdit({ move: event.shiftKey ? 'prev' : 'next' })
          }
        },
        // Clicking elsewhere keeps what was typed, as a spreadsheet does.
        onFocusOut: () => controller.commitEdit({ refocus: false }),
      }),
      errorProps: normalize({ ...dataGridAnatomy.attrs('editor-error'), id: errorId }),
    }
  }

  for (const index of indices) {
    const row = controller.data.rowAt(index)
    const key = row === undefined ? `placeholder-${index}` : controller.options.rowKey(row)
    const selected = row !== undefined && selectable && isSelected(grid.selection, key)
    const focusedRow = focus?.row === index
    rows.push({
      index,
      key,
      row,
      props: normalize({
        ...dataGridAnatomy.attrs('row'),
        role: 'row',
        'aria-rowindex': index + 2,
        'aria-selected': selectable ? (selected ? 'true' : 'false') : undefined,
        'data-selected': selected ? '' : undefined,
        'data-focused': focusedRow ? '' : undefined,
        // The row the detail sheet shows: marked while the focus is in the sheet.
        'data-open': grid.detail === index ? '' : undefined,
        'data-placeholder': row === undefined ? '' : undefined,
        'data-even': index % 2 === 1 ? '' : undefined,
        style: {
          width: `${layout.width}px`,
          height: `${viewport.rowHeight}px`,
          transform: `translateY(${index * viewport.rowHeight + shift}px)`,
        },
      }),
      cells: layout.columns.map((column, columnIndex) => {
        const def = column.def
        const isSelect = column.state.id === SELECT_COLUMN
        const opens = columnIndex === firstData && opensRows && row !== undefined
        const value = row !== undefined && def ? cellValue(def, row) : undefined
        const text = row !== undefined && def ? formatterFor(def, options)(value) : ''
        const editable = isEditable(def, row)
        const isEditing = Boolean(editing && editing.row === index && editing.column === columnIndex && def && row !== undefined)
        const save = row !== undefined && def ? grid.saves[cellKey(key, def.id)] : undefined
        return {
          key: column.state.id,
          isSelect,
          def,
          value,
          text,
          editor: isEditing ? editorFor(def!, index, columnIndex) : undefined,
          openProps:
            opens && !isEditing
              ? normalize({
                  ...dataGridAnatomy.attrs('open'),
                  type: 'button',
                  // For the pointer. The keyboard opens a row with Shift+Enter, which the
                  // cell says; to a screen reader the button would be a word in the cell's
                  // text, so it is hidden, and its word is drawn from `data-label`, out of
                  // the cell's text — a copied cell is the value alone.
                  tabIndex: -1,
                  'aria-hidden': 'true',
                  'data-label': openLabel,
                  title: `${openLabel} (Shift+Enter)`,
                  // The focus stays on the cell.
                  onPointerDown: (event: PointerEvent) => event.preventDefault(),
                  onMouseDown: (event: MouseEvent) => event.preventDefault(),
                  onClick: (event: MouseEvent) => {
                    // Not a press on the cell: nothing is selected, nothing starts editing.
                    event.stopPropagation()
                    controller.activate(index)
                  },
                  onDoubleClick: (event: MouseEvent) => event.stopPropagation(),
                })
              : null,
          props: normalize({
            ...dataGridAnatomy.attrs('cell'),
            id: cellId(index, columnIndex),
            role: 'gridcell',
            'aria-colindex': columnIndex + 1,
            'data-align': def ? alignOf(def) : 'center',
            'data-type': def?.type ?? (isSelect ? undefined : 'text'),
            'data-focused': focusedRow && focus?.column === columnIndex ? '' : undefined,
            'data-select': isSelect ? '' : undefined,
            'data-editable': editable ? '' : undefined,
            'data-editing': isEditing ? '' : undefined,
            'data-save': save?.status,
            // Cells that cannot be edited say so, once any column can.
            'aria-readonly': anyEditable && !editable && !isSelect ? 'true' : undefined,
            'aria-keyshortcuts': opens ? 'Shift+Enter' : undefined,
            title: save?.status === 'failed' ? save.message : undefined,
            ...pinAttrs(column),
            style: placement(column),
            onClick: (event: MouseEvent) => {
              // A press inside the editor is the editor's.
              if ((event.target as Element | null)?.closest?.('[data-part="editor"]')) return
              controller.press(index, columnIndex, {
                shiftKey: event.shiftKey,
                ctrlKey: event.ctrlKey,
                metaKey: event.metaKey,
                detail: event.detail,
              })
            },
            onContextMenu: (event: MouseEvent) => {
              // The browser's own menu stays unless a row menu is there to replace it.
              if (row === undefined || isSelect || isEditing || !controller.provides('menu')) return
              event.preventDefault()
              controller.openMenu(index, columnIndex, { x: event.clientX, y: event.clientY })
            },
          }),
          checkboxProps: normalize({
            ...dataGridAnatomy.attrs('checkbox'),
            type: 'checkbox',
            tabIndex: -1,
            'aria-label': options.selectRowLabel ?? 'Select row',
            checked: selected,
            disabled: row === undefined || undefined,
            'data-state': selected ? 'checked' : 'unchecked',
            onClick: (event: MouseEvent) => {
              event.stopPropagation()
              controller.check(index, { shiftKey: event.shiftKey })
              const box = event.currentTarget as HTMLInputElement
              box.checked = row !== undefined && isSelected(controller.getSnapshot().grid.selection, key)
            },
            onChange: () => {},
          }),
        }
      }),
    })
  }

  const empty = total === 0 && !data.loading && !data.stale && !data.error
  const notice = grid.notice
  const noticeHeader = notice ? (controller.options.columns.find((column) => column.id === notice.column)?.header ?? notice.column) : ''
  const noticeText = notice
    ? options.saveFailedText
      ? options.saveFailedText(noticeHeader, notice.message)
      : `Could not save ${noticeHeader}: ${notice.message}`
    : ''
  const listText = data.error
    ? (options.errorText ?? 'The rows could not be loaded.')
    : total === undefined
      ? 'Loading…'
      : [options.totalText ? options.totalText(total) : `${total.toLocaleString(options.locale)} rows`, count > 0 ? (options.selectedText ? options.selectedText(count) : `${count.toLocaleString(options.locale)} selected`) : '']
          .filter(Boolean)
          .join(', ')
  // A failed save is said first: it is news, and the old value is back.
  const statusText = noticeText ? `${noticeText}. ${listText}` : listText

  return {
    total,
    selectedCount: count,
    allSelected: all,
    layout,
    headerCells,
    rows,
    overlay: data.error ? ('error' as const) : empty ? ('empty' as const) : null,
    statusText,
    emptyText: options.emptyText ?? 'Nothing matches.',
    errorText: options.errorText ?? 'The rows could not be loaded.',
    retry: () => controller.data.retry(),

    frameProps: normalize({
      ...dataGridAnatomy.attrs('frame'),
      'data-stale': data.stale ? '' : undefined,
      'data-overlay': data.error ? 'error' : empty ? 'empty' : undefined,
      style: { '--gg-grid-header-height': viewport.headerHeight ? `${viewport.headerHeight}px` : undefined },
    }),
    rootProps: normalize({
      ...dataGridAnatomy.attrs('root'),
      id,
      role: 'grid',
      'aria-label': label,
      // The header is row 1. Unknown until the first answer: -1 says "unknown".
      'aria-rowcount': total === undefined ? -1 : total + 1,
      'aria-colcount': layout.columns.length,
      'aria-multiselectable': selectable ? 'true' : undefined,
      'aria-busy': data.loading ? 'true' : undefined,
      'aria-activedescendant': activeId,
      tabIndex: 0,
      'data-stale': data.stale ? '' : undefined,
      'data-loading': data.loading ? '' : undefined,
      'data-selectable': selectable ? '' : undefined,
      // Written only when the page fixed a height; otherwise the theme's stands,
      // and a density change in the theme reaches the rows.
      style: { '--gg-grid-row-height': controller.options.rowHeight ? `${controller.options.rowHeight}px` : undefined },
    }),
    headerProps: normalize({
      ...dataGridAnatomy.attrs('header'),
      role: 'row',
      'aria-rowindex': 1,
      style: { width: `${layout.width}px` },
    }),
    bodyProps: normalize({
      ...dataGridAnatomy.attrs('body'),
      role: 'rowgroup',
      style: { width: `${layout.width}px`, height: `${scrollHeight}px` },
    }),
    placeholderProps: normalize({ ...dataGridAnatomy.attrs('placeholder'), 'aria-hidden': 'true' }),
    /**
     * A box drawn as the Checkbox draws its own: the control holds the input
     * and, over it, the mark — an input draws no mark of its own. Around a
     * header's or a row's `checkboxProps`, with the row's mark in it.
     */
    checkboxControlProps: normalize({ ...dataGridAnatomy.attrs('checkbox-control') }),
    /** The Open button's icon, before its word. */
    openIconProps: normalize({ ...dataGridAnatomy.attrs('open-icon'), 'aria-hidden': 'true', 'data-icon': 'expand' }),
    checkboxIndicatorProps: normalize({ ...dataGridAnatomy.attrs('checkbox-indicator'), 'aria-hidden': 'true', 'data-icon': 'check' }),
    statusProps: normalize({ ...dataGridAnatomy.attrs('status'), role: 'status', 'aria-live': 'polite' }),
    overlayProps: normalize({
      ...dataGridAnatomy.attrs('overlay'),
      'data-kind': data.error ? 'error' : 'empty',
      role: data.error ? 'alert' : undefined,
    }),
  }
}

export type DataGridApi<Row, T = Dict> = ReturnType<typeof connect<Row, T>>
