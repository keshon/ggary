import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import {
  connectDetail,
  rowMenuAnchor,
  rowMenuTarget,
  type DataGridController,
  type DetailWords,
  type RowMenuTarget,
  type VirtualAnchor,
} from '@ggary/core/data-grid'
import { connect as connectMenu, createMenuMachine, type MenuEntry, type MenuSelectDetails } from '@ggary/core/menu'
import type { DialogSize } from '@ggary/core/dialog'
import { reactNormalizer } from '@ggary/core'
import { MenuContent } from '../menu/MenuContent'
import { Sheet } from '../dialog/Sheet'

export interface GridRowMenuProps<Row> {
  grid: DataGridController<Row>
  /**
   * The menu for a row. `target.selection` is set when the row is one of a
   * selection of several: the actions then act on all of it.
   */
  items: (target: RowMenuTarget<Row>) => MenuEntry[]
  onSelect: (value: string, target: RowMenuTarget<Row>, details: MenuSelectDetails) => void
  /** The menu's accessible name. */
  label?: string
}

/**
 * A row's context menu: a right click, Shift+F10 or the menu key on a row. It
 * stands at the pointer — or under the active cell for the keyboard — and
 * gives the focus back to the grid when it closes.
 */
export function GridRowMenu<Row>({ grid, items, onSelect, label = 'Row actions' }: GridRowMenuProps<Row>) {
  const id = `gg-grid-menu-${useId().replace(/:/g, '')}`
  const target = useRef<RowMenuTarget<Row> | null>(null)
  const anchor = useRef<VirtualAnchor | null>(null)
  const callbacks = useRef({ items, onSelect })
  callbacks.current = { items, onSelect }

  const [machine] = useState(() =>
    createMenuMachine({
      id,
      items: [],
      onSelect: (value, details) => {
        if (target.current) callbacks.current.onSelect(value, target.current, details)
      },
    })
  )
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const api = connectMenu(state, machine.send, reactNormalizer, { label })

  useEffect(() => grid.provide('menu'), [grid])

  const read = () => grid.getSnapshot().grid.menu?.nonce ?? 0
  const nonce = useSyncExternalStore(grid.subscribe, read, read)
  useEffect(() => {
    if (!nonce) return
    const snapshot = grid.getSnapshot()
    const found = rowMenuTarget(snapshot, grid)
    if (!found) return
    target.current = found
    anchor.current = rowMenuAnchor(snapshot, grid as DataGridController<unknown>)
    machine.send({ type: 'SYNC_ITEMS', items: callbacks.current.items(found) })
    // The keyboard lands on the first item; a pointer, on the menu itself.
    machine.send({ type: 'OPEN', reason: 'api', focus: snapshot.grid.menu?.point ? 'none' : 'first' })
  }, [grid, machine, nonce])

  return <MenuContent api={api} getState={machine.getState} reference={() => grid.element} anchor={() => anchor.current} dismissOnReference />
}

export interface GridDetailProps<Row> {
  grid: DataGridController<Row>
  /** The sheet's heading for a row: a lead's company, an order's number. */
  title: (row: Row) => ReactNode
  description?: (row: Row) => ReactNode
  /** The row, laid out: fields, history, a form that saves with `grid.saveCell`. */
  children: (row: Row, index: number) => ReactNode
  /** Beside the previous and next buttons. */
  footer?: (row: Row, index: number) => ReactNode
  words?: DetailWords
  /** Shown while a row stepped to is still loading. */
  loadingText?: string
  side?: 'start' | 'end'
  size?: DialogSize
  /**
   * Default false: the grid stays usable beside the sheet, and pressing
   * another row shows that one. Modal blocks the page instead.
   */
  modal?: boolean
}

/**
 * One row in a sheet beside the grid. It opens on Enter or a double click on
 * a row, walks to the previous and next rows without closing, and follows the
 * grid: arrow keys or a press on another row show that row.
 */
export function GridDetail<Row>(props: GridDetailProps<Row>) {
  const { grid, title, description, children, footer, words, loadingText = 'Loading…', side, size, modal = false } = props

  useEffect(() => grid.provide('detail'), [grid])
  const snapshot = useSyncExternalStore(grid.subscribe, grid.getSnapshot, grid.getSnapshot)
  const api = connectDetail(snapshot, grid, reactNormalizer, { words })
  const row = api.row

  return (
    <Sheet
      open={api.open}
      onOpenChange={api.onOpenChange}
      side={side}
      size={size}
      modal={modal}
      closeOnOutside={false}
      title={row === undefined ? loadingText : title(row)}
      description={row === undefined || !description ? undefined : description(row)}
      footer={
        <>
          <div {...api.navProps}>
            <button {...api.prevProps}>
              <span {...api.prevIconProps} />
            </button>
            <span {...api.positionProps}>{api.positionText}</span>
            <button {...api.nextProps}>
              <span {...api.nextIconProps} />
            </button>
          </div>
          {row !== undefined && api.index !== null && footer?.(row, api.index)}
        </>
      }
    >
      {row === undefined || api.index === null ? <p>{loadingText}</p> : children(row, api.index)}
    </Sheet>
  )
}
