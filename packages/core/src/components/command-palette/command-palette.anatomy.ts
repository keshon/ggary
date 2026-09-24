import { createAnatomy } from '../../types'

/**
 * A command palette: Ctrl+K (⌘K) from anywhere, a field that finds what to do
 * — an action, a place, a record — and Enter does it.
 *
 * It is a modal dialog holding the APG's editable combobox with a list that is
 * always shown: the focus stays in the field, the arrows move a highlight
 * that `aria-activedescendant` names, and Enter runs it. A command with
 * `children` opens a level of its own (Move card › a column); Backspace in an
 * empty field or Escape goes back up, and Escape at the top closes.
 */

export const paletteAnatomy = createAnatomy('command-palette', [
  'content',
  'control',
  'search-icon',
  'page',
  'input',
  'list',
  'group',
  'group-label',
  'item',
  'item-text',
  'item-description',
  'item-shortcut',
  'item-branch',
  'empty',
  'status',
  'footer',
  'hint',
  'key',
] as const)
export type PalettePart = (typeof paletteAnatomy.parts)[number]
