import type { OpenIntent } from '../../utils/open-intent'
import type { Placement } from '../../utils/position'
import type { TypeaheadState } from '../../utils/typeahead'

export type MenuPlacement = Placement

interface MenuItemBase {
  value: string
  label: string
  /** Stays in the arrow-key walk, as the APG asks, but is never activated. */
  disabled?: boolean
  /** Shown at the far edge. Text only: "⌘C", "Ctrl+Shift+P". */
  shortcut?: string
  /** Overrides the menu's `closeOnSelect` for this item. */
  closeOnSelect?: boolean
}

/** An action. With `href` it renders as a link, so middle-click and "open in new tab" still work. */
export interface MenuActionItem extends MenuItemBase {
  type?: 'item'
  href?: string
  tone?: 'danger'
}

/** A toggle. The owner holds `checked`; selecting reports the next state. */
export interface MenuCheckboxItem extends MenuItemBase {
  type: 'checkbox'
  checked?: boolean
}

/** One of a set: every radio in the same group — or at the menu's top level — is one set. */
export interface MenuRadioItem extends MenuItemBase {
  type: 'radio'
  checked?: boolean
}

/** An item that opens a menu of its own. It is never reported: its items are. */
export interface MenuSubmenuItem {
  type: 'submenu'
  value: string
  label: string
  disabled?: boolean
  items: MenuEntry[]
}

export type MenuItem = MenuActionItem | MenuCheckboxItem | MenuRadioItem | MenuSubmenuItem

export interface MenuSeparator {
  type: 'separator'
}

/** Items under a label. One level: a group holds items, not groups. */
export interface MenuGroup {
  type: 'group'
  label?: string
  items: MenuItem[]
}

export type MenuEntry = MenuItem | MenuSeparator | MenuGroup

export type MenuChangeReason = 'trigger' | 'escape' | 'outside' | 'select' | 'tab' | 'api'

export interface MenuChangeDetails {
  reason: MenuChangeReason
}

export interface MenuSelectDetails {
  item: MenuActionItem | MenuCheckboxItem | MenuRadioItem
  /** For a checkbox, the state it asks for; for a radio, always true. Absent for an action. */
  checked?: boolean
}

/** Where the highlight lands when a menu opens. `none`: on the menu itself, as a pointer opens it. */
export type MenuOpenFocus = 'first' | 'last' | 'none'

export interface MenuOptions {
  placement: MenuPlacement
  closeOnSelect: boolean
}

export interface MenuPoint {
  x: number
  y: number
}

/**
 * The corridor a pointer may cross on its way from a submenu's trigger to the
 * submenu, without the rows it passes over taking the highlight. It lasts as
 * long as `until` (a timestamp) and belongs to the rows of `level`.
 */
export interface MenuGrace {
  level: number
  polygon: MenuPoint[]
  until: number
}

export interface MenuState extends MenuOptions {
  id: string
  items: MenuEntry[]
  open: boolean
  controlled: boolean
  intent: OpenIntent<MenuChangeReason>
  /**
   * One entry per open level: the highlighted index in that level's items, or
   * -1. Level 0 is the menu; each further level is the submenu of the item
   * highlighted in the level before. Empty while closed.
   */
  path: number[]
  /** The level that holds focus and hears the keyboard. */
  focusLevel: number
  /** How the last open request asked to land; read when `open` actually turns true. */
  openFocus: MenuOpenFocus
  typeahead: TypeaheadState
  grace: MenuGrace | null
  /** The last item the user activated, with a counter so repeats are heard. */
  selection: { item: MenuSelectDetails['item'] | null; checked?: boolean; nonce: number }
}

export type MenuEvent =
  | { type: 'OPEN'; reason?: MenuChangeReason; focus?: MenuOpenFocus }
  | { type: 'CLOSE'; reason: MenuChangeReason }
  | { type: 'TOGGLE'; reason?: MenuChangeReason; focus?: MenuOpenFocus }
  /** Escape: closes the level that holds focus, and the menu from its first level. */
  | { type: 'ESCAPE' }
  /** A pointer over a row. Opens a submenu row's menu; ignored inside a grace corridor. */
  | { type: 'HIGHLIGHT'; level: number; index: number; pointer?: MenuPoint & { now: number } }
  /** A pointer leaving a row: the highlight drops unless the row's submenu is open. */
  | { type: 'UNHIGHLIGHT'; level: number; index: number }
  | { type: 'GRACE'; grace: MenuGrace }
  | { type: 'HIGHLIGHT_MOVE'; step: number }
  | { type: 'HIGHLIGHT_EDGE'; edge: 'first' | 'last' }
  /** Open the highlighted submenu row's menu and move focus into it. */
  | { type: 'SUBMENU_OPEN' }
  /** Close the submenu that holds focus and give focus back to its row. */
  | { type: 'SUBMENU_CLOSE' }
  /** Activate a row. `pointer`: a real click, which opens a submenu without moving focus into it. */
  | { type: 'SELECT'; level?: number; index?: number; pointer?: boolean }
  | { type: 'TYPE'; char: string; now: number }
  | { type: 'SYNC_OPEN'; open: boolean }
  | { type: 'SYNC_ITEMS'; items: MenuEntry[] }
  | ({ type: 'SYNC_OPTIONS' } & Partial<MenuOptions>)
