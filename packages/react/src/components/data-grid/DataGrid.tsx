import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import {
  connect,
  createArraySource,
  createDataGrid,
  type CellEdit,
  type CellEditor,
  type ColumnDef,
  type DataGridController,
  type DataGridOptions,
  type EditWords,
  type GridQuery,
  type GridSource,
  type RowKey,
  type Selection,
} from '@ggary/core/data-grid'
import { reactNormalizer, type Dict } from '@ggary/core'

export interface DataGridProps<Row> {
  columns: ColumnDef<Row>[]
  /** Rows in the page: the grid sorts and filters them itself. */
  rows?: readonly Row[]
  /** Or a source that answers queries — a server. Takes precedence over `rows`. */
  source?: GridSource<Row>
  rowKey: (row: Row) => RowKey
  /** The grid's name: every grid on a page needs one. */
  label: string
  selectable?: boolean
  /** The query the grid starts with — from the URL, say. */
  initialQuery?: Partial<GridQuery>
  onQueryChange?: (query: GridQuery) => void
  onSelectionChange?: (selection: Selection) => void
  /** Enter or a double click on a row. */
  onRowActivate?: (row: Row, index: number) => void
  /**
   * Save an edited cell (columns opt in with `editable`). Shown at once; a
   * rejection puts the old value back and says why. Resolve with the saved
   * row to show the server's version.
   */
  onCellEdit?: (edit: CellEdit<Row>) => Promise<Row | void> | Row | void
  editWords?: EditWords
  /** "Could not save Paid: the deal is closed". */
  saveFailedText?: (column: string, message: string) => string
  /** A cell of your own; `text` is the formatted value, for when you only wrap it. */
  renderCell?: (row: Row, column: ColumnDef<Row>, text: string) => ReactNode
  /** Shown when the query matches nothing — an EmptyState, usually. */
  empty?: ReactNode
  emptyText?: string
  errorText?: string
  retryLabel?: string
  locale?: string
  rowHeight?: number
  blockSize?: number
  /** Receives the controller: for bulk actions, a filter bar, "refresh after save". */
  controllerRef?: (controller: DataGridController<Row>) => void
  style?: CSSProperties
}

export function DataGrid<Row>(props: DataGridProps<Row>) {
  const {
    columns, rows, rowKey, label, selectable, initialQuery, onQueryChange, onSelectionChange, onRowActivate,
    renderCell, empty, emptyText, errorText, retryLabel = 'Try again', locale, rowHeight, blockSize, controllerRef, style,
    onCellEdit, editWords, saveFailedText,
  } = props
  const id = `gg-grid-${useId().replace(/:/g, '')}`

  const arraySource = useMemo(() => (rows ? createArraySource(rows, columns, { locale }) : undefined), [rows, columns, locale])
  const source = props.source ?? arraySource
  if (!source) throw new Error('DataGrid needs `rows` or a `source`.')

  const [controller] = useState(() =>
    createDataGrid<Row>({
      columns, source, rowKey, selectable, rowHeight, blockSize, query: initialQuery,
      onQueryChange, onSelectionChange, onRowActivate, onCellEdit, editWords,
    } satisfies DataGridOptions<Row>)
  )

  // The owner's newest callbacks, columns and source; the grid keeps its state.
  useEffect(() => {
    controller.update({ columns, source, rowKey, onQueryChange, onSelectionChange, onRowActivate, onCellEdit })
  }, [controller, columns, source, rowKey, onQueryChange, onSelectionChange, onRowActivate, onCellEdit])

  // In braces: whatever the callback returns must not be taken for a cleanup.
  useEffect(() => {
    controllerRef?.(controller)
  }, [controller, controllerRef])
  // No destroy on unmount: StrictMode unmounts and remounts once, and a
  // destroyed grid would never load again. Detaching (below) aborts what is in
  // flight; the controller itself is collected with the component.

  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot)
  const api = connect(snapshot, controller, reactNormalizer, { id, label, emptyText, errorText, locale, saveFailedText })

  const root = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => (root.current ? controller.attach(root.current) : undefined), [controller])

  return (
    <div {...api.frameProps} style={{ ...(api.frameProps.style as CSSProperties | undefined), ...style }}>
      <div ref={root} {...api.rootProps}>
        <div {...api.headerProps}>
          {api.headerCells.map((header) => (
            <div key={header.key} {...header.props}>
              {header.isSelect ? (
                <span {...api.checkboxControlProps}>
                  <input
                    {...header.checkboxProps}
                    ref={(box) => {
                      if (box) box.indeterminate = header.indeterminate
                    }}
                  />
                  <span {...header.checkboxIndicatorProps} />
                </span>
              ) : (
                <>
                  <span {...header.labelProps}>{header.label}</span>
                  {header.sortable && <span {...header.sortProps} />}
                  <span {...header.resizeProps} />
                </>
              )}
            </div>
          ))}
        </div>
        <div {...api.bodyProps}>
          {api.rows.map((line) => (
            <div key={line.key} {...line.props}>
              {line.cells.map((cell) => (
                <div key={cell.key} {...cell.props}>
                  {cell.isSelect ? (
                    <span {...api.checkboxControlProps}>
                      <input {...cell.checkboxProps} />
                      <span {...api.checkboxIndicatorProps} />
                    </span>
                  ) : line.row === undefined ? (
                    <span {...api.placeholderProps} />
                  ) : cell.editor ? (
                    <CellEditorView editor={cell.editor} />
                  ) : renderCell && cell.def ? (
                    renderCell(line.row, cell.def as ColumnDef<Row>, cell.text)
                  ) : (
                    cell.text
                  )}
                  {cell.openProps && (
                    <button {...cell.openProps}>
                      <span {...api.openIconProps} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      {api.overlay && (
        <div {...api.overlayProps}>
          {api.overlay === 'error' ? (
            <>
              <p>{api.errorText}</p>
              <button type="button" onClick={api.retry}>
                {retryLabel}
              </button>
            </>
          ) : (
            (empty ?? <p>{api.emptyText}</p>)
          )}
        </div>
      )}
      <div {...api.statusProps}>{api.statusText}</div>
    </div>
  )
}

/**
 * The editor in a cell. It takes the focus when it appears, with the caret at
 * the end — after the character that opened it, or after the value.
 */
function CellEditorView({ editor }: { editor: CellEditor<Dict> }) {
  const ref = useRef<HTMLInputElement & HTMLSelectElement>(null)
  useLayoutEffect(() => {
    const field = ref.current
    if (!field) return
    field.focus({ preventScroll: true })
    if (editor.kind === 'text' || editor.kind === 'number') field.setSelectionRange(field.value.length, field.value.length)
  }, [])
  return (
    <>
      {editor.kind === 'select' ? (
        <select ref={ref} {...editor.inputProps}>
          {editor.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input ref={ref} {...editor.inputProps} />
      )}
      {editor.error && <span {...editor.errorProps}>{editor.error}</span>}
    </>
  )
}
