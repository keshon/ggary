import { createMachine, withEffects, type Machine } from '../../machine'
import { clampIndex, edgeEnabled, nextEnabled } from '../../utils/collection'
import { matchesMnemonic, parseMnemonic } from '../../utils/mnemonic'
import { syncOptions } from '../../utils/open-intent'
import { initialState as menuInitialState, reducer as menuReducer, reportedSelection } from '../menu/menu.machine'
import type { MenuEvent } from '../menu/menu.types'
import type { MenubarEvent, MenubarOptions, MenubarSelectDetails, MenubarState } from './menubar.types'

export const DEFAULTS: MenubarOptions = { closeOnSelect: true }

/** The id of the bar's `index`th menu. Its bar item is that menu's trigger. */
export const menubarMenuId = (id: string, index: number) => `${id}-menu-${index}`

// The bar walks every item, disabled ones too, and wraps (APG menubar).
const walkAll = { loop: true }
// Moving between OPEN menus skips the ones that cannot open.
const walkOpenable = (state: MenubarState) => ({ loop: true, isDisabled: (menu: MenubarState['menus'][number]) => !!menu.disabled })

function openMenu(state: MenubarState, index: number, focus: 'first' | 'last' | 'none'): MenubarState {
  const target = state.menus[index]
  if (!target || target.disabled) return state
  if (state.openIndex === index && state.menu.open) return state
  const closed = menuInitialState({
    id: menubarMenuId(state.id, index),
    items: target.items,
    closeOnSelect: state.closeOnSelect,
    placement: 'bottom-start',
  })
  return { ...state, openIndex: index, focusIndex: index, menu: menuReducer(closed, { type: 'OPEN', focus, reason: 'trigger' }) }
}

function closeMenu(state: MenubarState, reason: 'trigger' | 'api'): MenubarState {
  if (state.openIndex === -1) return state
  return { ...state, openIndex: -1, mnemonics: false, menu: menuReducer(state.menu, { type: 'CLOSE', reason }) }
}

/** From an open menu to the next one that can open, on its first row. */
function stepOpen(state: MenubarState, step: number): MenubarState {
  const next = nextEnabled(state.menus, state.openIndex, step, walkOpenable(state))
  if (next === -1 || next === state.openIndex) return state
  return openMenu(state, next, 'first')
}

function delegate(state: MenubarState, event: MenuEvent): MenubarState {
  if (state.openIndex === -1) return state
  const menu = menuReducer(state.menu, event)

  // Keys the menu had no use for move along the bar (APG menubar): ArrowRight
  // on a row with no submenu, at any depth, and ArrowLeft on the menu's own
  // level, where there is no submenu left to close.
  if (menu === state.menu) {
    if (event.type === 'SUBMENU_OPEN') return stepOpen(state, 1)
    if (event.type === 'SUBMENU_CLOSE' && state.menu.focusLevel === 0) return stepOpen(state, -1)
  }
  if (menu === state.menu) return state

  let next: MenubarState = { ...state, menu }
  const selected = reportedSelection(state.menu, menu)
  if (selected) {
    next = { ...next, selection: { menu: state.menus[state.openIndex].value, details: selected[1], nonce: state.selection.nonce + 1 } }
  }
  if (!menu.open) next = { ...next, openIndex: -1, mnemonics: false }
  return next
}

export function reducer(state: MenubarState, event: MenubarEvent): MenubarState {
  switch (event.type) {
    case 'FOCUS':
      // While a menu is open the tab stop is that menu's item. Focus reaching
      // another bar item then is a closing menu handing focus back to its own
      // item as the next one opens, not the user moving along the bar.
      if (state.openIndex !== -1) return state
      return event.index === state.focusIndex || !state.menus[event.index] ? state : { ...state, focusIndex: event.index }

    case 'MOVE': {
      const next = nextEnabled(state.menus, state.focusIndex, event.step, walkAll)
      return next === -1 || next === state.focusIndex ? state : { ...state, focusIndex: next }
    }

    case 'EDGE': {
      const next = edgeEnabled(state.menus, event.edge, walkAll)
      return next === -1 || next === state.focusIndex ? state : { ...state, focusIndex: next }
    }

    case 'OPEN':
      return openMenu(state, event.index, event.focus)

    case 'TOGGLE':
      if (state.openIndex === event.index) return closeMenu(state, 'trigger')
      return state.menus[event.index]?.disabled ? { ...state, focusIndex: event.index } : openMenu(state, event.index, 'none')

    case 'HOVER':
      if (state.openIndex === -1 || state.openIndex === event.index) return state
      return openMenu(state, event.index, 'none')

    case 'CLOSE':
      return closeMenu(state, 'api')

    case 'MENU':
      return delegate(state, event.event)

    case 'MNEMONIC': {
      const index = state.menus.findIndex(
        (menu) => !menu.disabled && matchesMnemonic(parseMnemonic(menu.label).key, event.key, event.code)
      )
      if (index === -1) return state
      const opened = openMenu(state, index, 'first')
      return opened === state ? state : { ...opened, mnemonics: true }
    }

    case 'ENTER_BAR': {
      const closed = closeMenu(state, 'api')
      return { ...closed, focusIndex: Math.max(0, edgeEnabled(state.menus, 'first', walkAll)), mnemonics: true }
    }

    case 'SHOW_MNEMONICS':
      return event.show === state.mnemonics ? state : { ...state, mnemonics: event.show }

    case 'SYNC_MENUS': {
      if (event.menus === state.menus) return state
      const focusIndex = Math.max(0, clampIndex(state.focusIndex, event.menus.length))
      const base = { ...state, menus: event.menus, focusIndex }
      const open = event.menus[state.openIndex]
      if (state.openIndex === -1) return base
      if (!open || open.disabled) return closeMenu(base, 'api')
      return { ...base, menu: menuReducer(state.menu, { type: 'SYNC_ITEMS', items: open.items }) }
    }

    case 'SYNC_OPTIONS': {
      const { type: _type, ...options } = event
      const next = syncOptions(state, DEFAULTS, options)
      if (next === state || state.openIndex === -1) return next
      return { ...next, menu: menuReducer(next.menu, { type: 'SYNC_OPTIONS', closeOnSelect: next.closeOnSelect }) }
    }
  }
}

export interface MenubarMachineConfig extends Partial<MenubarOptions> {
  id: string
  menus?: MenubarState['menus']
  /** Called with the item's value when the user activates it, in any menu at any depth. */
  onSelect?: (value: string, details: MenubarSelectDetails) => void
  /** Called with the value of the menu that opened, or null when the bar closes. */
  onOpenChange?: (menu: string | null) => void
}

export function initialState(config: MenubarMachineConfig): MenubarState {
  return {
    id: config.id,
    menus: config.menus ?? [],
    closeOnSelect: config.closeOnSelect ?? DEFAULTS.closeOnSelect,
    focusIndex: 0,
    openIndex: -1,
    menu: menuInitialState({ id: menubarMenuId(config.id, 0) }),
    mnemonics: false,
    selection: { menu: null, details: null, nonce: 0 },
  }
}

export function createMenubarMachine(config: MenubarMachineConfig): Machine<MenubarState, MenubarEvent> {
  const machine = createMachine(initialState(config), reducer)
  return withEffects(machine, (previous, next) => {
    const { menu, details, nonce } = next.selection
    if (nonce !== previous.selection.nonce && menu !== null && details) {
      config.onSelect?.(details.item.value, { ...details, menu })
    }
    if (previous.openIndex !== next.openIndex) {
      config.onOpenChange?.(next.openIndex === -1 ? null : next.menus[next.openIndex].value)
    }
  })
}
