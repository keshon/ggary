import { createAnatomy } from '../../types'

/**
 * A choice from a tree, one level to a column: country, then region, then
 * city. What a Select cannot hold — three hundred cities in one list — and a
 * tree view would make tall.
 *
 * There is no ARIA pattern for it, so it is built from two that exist, as
 * Instrument's is: a button that opens a dialog, and in the dialog one listbox
 * per level. Each column is one tab stop and moves with the arrows; the column
 * to its right follows the highlighted item, the way a file browser's does.
 * Right goes into an item's children and Left back to its parent; Enter chooses
 * a leaf (or any item, with `selectParents`); Escape closes and gives the focus
 * back to the button. Each column is named by its parent — "Russia" — so a
 * screen reader says where the focus has gone.
 */

export const cascaderAnatomy = createAnatomy('cascader', [
  'root',
  'label',
  'trigger',
  'value',
  'value-item',
  'separator',
  'indicator',
  'positioner',
  'content',
  'column',
  'item',
  'item-text',
  'item-branch',
  'item-indicator',
] as const)
export type CascaderPart = (typeof cascaderAnatomy.parts)[number]
