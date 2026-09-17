import type { MenuEntry, MenuEvent, MenuSelectDetails, MenuState } from '../menu/menu.types'

/**
 * One menu of the bar. `label` may mark its access key with `&`, as desktop
 * toolkits do: `&File` is Alt+F, `Save &As` is Alt+A, and `&&` is a literal `&`.
 */
export interface MenubarMenu {
  value: string
  label: string
  items: MenuEntry[]
  /** Reachable on the bar, never opened. */
  disabled?: boolean
}

export interface MenubarOptions {
  closeOnSelect: boolean
}

export interface MenubarSelectDetails extends MenuSelectDetails {
  /** The value of the bar's menu the item was chosen from. */
  menu: string
}

export interface MenubarState extends MenubarOptions {
  id: string
  menus: MenubarMenu[]
  /** The bar's one tab stop. */
  focusIndex: number
  /** The menu that is open, or -1. */
  openIndex: number
  /** The open menu's own state; closed when `openIndex` is -1. */
  menu: MenuState
  /** Access keys are underlined: Alt is held, or the bar was reached with F10. */
  mnemonics: boolean
  selection: { menu: string | null; details: MenuSelectDetails | null; nonce: number }
}

export type MenubarEvent =
  /** Real focus arrived on a bar item: the tab stop follows it. */
  | { type: 'FOCUS'; index: number }
  | { type: 'MOVE'; step: number }
  | { type: 'EDGE'; edge: 'first' | 'last' }
  | { type: 'OPEN'; index: number; focus: 'first' | 'last' | 'none' }
  /** A press on a bar item. */
  | { type: 'TOGGLE'; index: number }
  /** A pointer entering a bar item: while a menu is open, that one opens instead. */
  | { type: 'HOVER'; index: number }
  | { type: 'CLOSE' }
  /** An event for the open menu. */
  | { type: 'MENU'; event: MenuEvent }
  /** Alt with a key. `code` is the physical key, for a Latin access key typed on another layout. */
  | { type: 'MNEMONIC'; key: string; code?: string }
  | { type: 'SHOW_MNEMONICS'; show: boolean }
  /** F10: close any menu, put the tab stop on the first item and underline the access keys. */
  | { type: 'ENTER_BAR' }
  | { type: 'SYNC_MENUS'; menus: MenubarMenu[] }
  | ({ type: 'SYNC_OPTIONS' } & Partial<MenubarOptions>)
