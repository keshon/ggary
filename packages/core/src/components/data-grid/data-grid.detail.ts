import { createAnatomy, type Dict, type Normalizer } from '../../types'
import type { DataGridController, DataGridSnapshot } from './data-grid.controller'
import { isSelected, selectedCount, selectionPayload } from './data-grid.selection'
import type { ColumnDef, SelectionPayload } from './data-grid.types'

/**
 * What lives beside the grid and opens from a row: the detail sheet, which
 * shows one row and walks to the next without closing, and the row menu,
 * which a right click, Shift+F10 or the menu key opens.
 */

export const gridDetailAnatomy = createAnatomy('grid-detail', ['nav', 'position', 'prev', 'next', 'icon'] as const)

export interface DetailWords {
  locale?: string
  /** "12 of 1,204". */
  position?: (index: number, total: number) => string
  previous?: string
  next?: string
}

export function connectDetail<Row, T = Dict>(
  snapshot: DataGridSnapshot,
  controller: DataGridController<Row>,
  normalize: Normalizer<T>,
  words: DetailWords = {}
) {
  const index = snapshot.grid.detail
  const total = snapshot.data.total ?? 0
  const open = index !== null
  // Undefined while the row is on its way: stepping past what is loaded asks for it.
  const row = open ? controller.data.rowAt(index) : undefined
  const format = (value: number) => value.toLocaleString(words.locale)
  const position = words.position ?? ((at, of) => `${format(at + 1)} of ${format(of)}`)
  const atStart = !open || index === 0
  const atEnd = !open || index >= total - 1

  return {
    open,
    index,
    row,
    total,
    positionText: open ? position(index, total) : '',
    close: () => controller.closeDetail(),
    /** For a Sheet's onOpenChange: the sheet closed itself (Escape, ✕). */
    onOpenChange: (next: boolean) => {
      if (!next) controller.closeDetail()
    },
    navProps: normalize({ ...gridDetailAnatomy.attrs('nav'), role: 'group', 'aria-label': 'Rows' }),
    positionProps: normalize({ ...gridDetailAnatomy.attrs('position'), 'aria-live': 'polite' }),
    prevProps: normalize({
      ...gridDetailAnatomy.attrs('prev'),
      type: 'button',
      'aria-label': words.previous ?? 'Previous row',
      'aria-disabled': atStart ? 'true' : undefined,
      // aria-disabled, not disabled: the button keeps its focus at the first row.
      onClick: () => controller.stepDetail(-1),
    }),
    nextProps: normalize({
      ...gridDetailAnatomy.attrs('next'),
      type: 'button',
      'aria-label': words.next ?? 'Next row',
      'aria-disabled': atEnd ? 'true' : undefined,
      onClick: () => controller.stepDetail(1),
    }),
    /** The glyph inside each button: a chevron, turned for "previous" by the theme. */
    prevIconProps: normalize({ ...gridDetailAnatomy.attrs('icon'), 'aria-hidden': 'true', 'data-icon': 'chevron-down', 'data-direction': 'prev' }),
    nextIconProps: normalize({ ...gridDetailAnatomy.attrs('icon'), 'aria-hidden': 'true', 'data-icon': 'chevron-down', 'data-direction': 'next' }),
  }
}

export type GridDetailApi<Row, T = Dict> = ReturnType<typeof connectDetail<Row, T>>

/** The row a menu was asked for, and whether it acts on a selection. */
export interface RowMenuTarget<Row> {
  row: Row
  index: number
  column: ColumnDef<Row> | undefined
  /**
   * When the row is part of a selection of more than one, the selection: the
   * menu's actions are expected to act on all of it, as a file manager's do.
   */
  selection: SelectionPayload | null
}

export function rowMenuTarget<Row>(snapshot: DataGridSnapshot, controller: DataGridController<Row>): RowMenuTarget<Row> | null {
  const request = snapshot.grid.menu
  if (!request) return null
  const row = controller.data.rowAt(request.row)
  if (row === undefined) return null
  const { selection, query } = snapshot.grid
  const inSelection = isSelected(selection, controller.options.rowKey(row)) && (selectedCount(selection, snapshot.data.total) ?? 0) > 1
  return {
    row,
    index: request.row,
    column: controller.layout().columns[request.column]?.def as ColumnDef<Row> | undefined,
    selection: inSelection ? selectionPayload(selection, query) : null,
  }
}

/** Something to place a floating element against: a point, or an element's box. */
export interface VirtualAnchor {
  getBoundingClientRect(): DOMRect
  contextElement?: Element
}

/**
 * Where the row menu stands: at the pointer that asked for it, or under the
 * active cell when the keyboard did.
 */
export function rowMenuAnchor(snapshot: DataGridSnapshot, controller: DataGridController<unknown>): VirtualAnchor | null {
  const request = snapshot.grid.menu
  const grid = controller.element
  if (!request || !grid) return null
  if (request.point) {
    const { x, y } = request.point
    return { getBoundingClientRect: () => new DOMRect(x, y, 0, 0), contextElement: grid }
  }
  const cell = grid.querySelector<HTMLElement>('[data-part="cell"][data-focused]')
  return cell ?? grid
}
