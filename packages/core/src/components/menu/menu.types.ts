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

export type MenuItem = MenuActionItem | MenuCheckboxItem | MenuRadioItem

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
  item: MenuItem
  /** For a checkbox, the state it asks for; for a radio, always true. Absent for an action. */
  checked?: boolean
}

/** Where the highlight lands when the menu opens. `none`: on the menu itself, as a pointer opens it. */
export type MenuOpenFocus = 'first' | 'last' | 'none'

export interface MenuOptions {
  placement: MenuPlacement
  closeOnSelect: boolean
}

export interface MenuState extends MenuOptions {
  id: string
  items: MenuEntry[]
  open: boolean
  controlled: boolean
  intent: OpenIntent<MenuChangeReason>
  /** Index into the flat list of items, separators and group labels excluded. -1: none. */
  highlightedIndex: number
  /** How the last open request asked to land; read when `open` actually turns true. */
  openFocus: MenuOpenFocus
  typeahead: TypeaheadState
  /** The last item the user activated, with a counter so repeats are heard. */
  selection: { item: MenuItem | null; checked?: boolean; nonce: number }
}

export type MenuEvent =
  | { type: 'OPEN'; reason?: MenuChangeReason; focus?: MenuOpenFocus }
  | { type: 'CLOSE'; reason: MenuChangeReason }
  | { type: 'TOGGLE'; reason?: MenuChangeReason; focus?: MenuOpenFocus }
  | { type: 'HIGHLIGHT'; index: number }
  | { type: 'HIGHLIGHT_MOVE'; step: number }
  | { type: 'HIGHLIGHT_EDGE'; edge: 'first' | 'last' }
  | { type: 'SELECT'; index?: number }
  | { type: 'TYPE'; char: string; now: number }
  | { type: 'SYNC_OPEN'; open: boolean }
  | { type: 'SYNC_ITEMS'; items: MenuEntry[] }
  | ({ type: 'SYNC_OPTIONS' } & Partial<MenuOptions>)
