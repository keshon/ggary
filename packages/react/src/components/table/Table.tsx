import { useEffect, useId, useRef, useState, useSyncExternalStore, type HTMLAttributes, type ReactNode } from 'react'
import {
  connect,
  createTableMachine,
  textOf,
  type TableColumnDef,
  type TableConnectOptions,
  type TableRowKey,
  type TableSort,
  type TableWords,
} from '@ggary/core/table'
import { reactNormalizer } from '@ggary/core'
import { useConfigured } from '../config-provider'
import { Checkbox } from '../checkbox'

export interface TableProps<Row = any> extends Omit<HTMLAttributes<HTMLTableElement>, 'defaultValue'> {
  columns: TableColumnDef<Row>[]
  rows: Row[]
  getRowKey?: (row: Row, index: number) => TableRowKey
  /** Read above the table by a screen reader, and shown there. Without it, `label` names the table. */
  caption?: string
  /** The table's accessible name when it carries no caption. */
  label?: string
  /** A checkbox column. Off unless asked for. */
  selectable?: boolean
  /** Controlled. Omit and use `defaultSort` for uncontrolled. */
  sort?: TableSort | null
  defaultSort?: TableSort | null
  onSortChange?: (sort: TableSort | null) => void
  /** Controlled. Omit and use `defaultSelection` for uncontrolled. */
  selection?: TableRowKey[]
  defaultSelection?: TableRowKey[]
  onSelectionChange?: (selection: TableRowKey[]) => void
  /** Reads the row's key for its checkbox. Defaults to the position: "Row 1". */
  rowName?: (row: Row, index: number) => string
  /** A sort button's name, given the column and where it stands. */
  sortLabel?: TableConnectOptions<Row>['sortLabel']
  /** What the table says: empty, select-all. Each entry has an English default. */
  words?: TableWords
  /** What a cell shows. Defaults to the value as text. Buttons, badges, links — anything a cell can hold. */
  renderCell?: (row: Row, column: TableColumnDef<Row>, index: number) => ReactNode
}

/**
 * A regular table over native elements: a caption, sortable headers with
 * `aria-sort`, an optional checkbox column, and cells that render whatever a
 * column's `render` returns. Finite rows, one client-side sort key — what
 * answers a query stays in DataGrid.
 */
export function Table<Row = any>(props: TableProps<Row>) {
  props = useConfigured(props, { words: 'table' })
  const {
    columns, rows, getRowKey, caption, label, selectable, sort, defaultSort, onSortChange,
    selection, defaultSelection, onSelectionChange, rowName, sortLabel, words = {}, renderCell,
    ...rest
  } = props

  const id = `gg-table-${useId().replace(/:/g, '')}`
  const callbacks = useRef({ onSortChange, onSelectionChange })
  callbacks.current = { onSortChange, onSelectionChange }

  const [machine] = useState(() =>
    createTableMachine({
      id, columns, rows, getRowKey, selectable, sort, defaultSort,
      onSortChange: (next) => callbacks.current.onSortChange?.(next),
      selection, defaultSelection,
      onSelectionChange: (next) => callbacks.current.onSelectionChange?.(next),
    })
  )
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const api = connect(state, machine.send, reactNormalizer, { caption, label, rowName, sortLabel, words })

  useEffect(() => machine.send({ type: 'SYNC_ROWS', rows }), [machine, rows])
  useEffect(() => machine.send({ type: 'SYNC_COLUMNS', columns }), [machine, columns])
  useEffect(() => {
    if (sort !== undefined) machine.send({ type: 'SYNC_SORT', sort })
  }, [machine, sort])
  useEffect(() => {
    if (selection !== undefined) machine.send({ type: 'SYNC_SELECTION', selection })
  }, [machine, selection])
  useEffect(() => machine.send({ type: 'SYNC_OPTIONS', selectable }), [machine, selectable])

  return (
    <table {...rest} {...api.rootProps}>
      {caption !== undefined && <caption {...api.captionProps}>{caption}</caption>}
      <thead {...api.headerProps}>
        <tr {...api.headerRowProps}>
          {state.selectable && (
            <th {...api.selectHeaderCellProps}>
              <Checkbox {...api.selectAllCheckboxProps()} />
            </th>
          )}
          {state.columns.map((column) => (
            <th key={column.id} {...api.getHeaderCellProps(column)}>
              {column.sortable !== false ? (
                <button {...api.getSortButtonProps(column)}>
                  {column.header}
                  <span {...api.getSortIconProps(column)} />
                </button>
              ) : (
                column.header
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody {...api.bodyProps}>
        {api.entries.length === 0 ? (
          <tr {...api.emptyRowProps}>
            <td {...api.emptyCellProps()}>
              <span {...api.emptyProps}>{api.texts.empty}</span>
            </td>
          </tr>
        ) : (
          api.entries.map((entry) => (
            <tr key={entry.key} {...api.getRowProps(entry)}>
              {state.selectable && (
                <td {...api.getSelectCellProps(entry)}>
                  <Checkbox {...api.getRowCheckboxProps(entry)} />
                </td>
              )}
              {state.columns.map((column) => {
                const value = column.value ? column.value(entry.row) : (entry.row as Record<string, unknown>)[column.id]
                return (
                  <td key={column.id} {...api.getCellProps(column, entry)}>
                    {renderCell?.(entry.row, column, entry.index) ?? textOf(value)}
                  </td>
                )
              })}
            </tr>
          ))
        )}
      </tbody>
    </table>
  )
}
