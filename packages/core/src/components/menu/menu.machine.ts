import { createMachine, withEffects, type Machine } from '../../machine'
import { clampIndex, edgeEnabled, nextEnabled } from '../../utils/collection'
import { changeDetails, initialOpen, requestOpen, syncOpen, syncOptions } from '../../utils/open-intent'
import { typeahead } from '../../utils/typeahead'
import { isSubmenu, levelItems, pointInPolygon } from './menu.collection'
import type {
  MenuChangeDetails,
  MenuChangeReason,
  MenuEntry,
  MenuEvent,
  MenuItem,
  MenuOpenFocus,
  MenuOptions,
  MenuSelectDetails,
  MenuState,
} from './menu.types'

export const DEFAULTS: MenuOptions = { placement: 'bottom-start', closeOnSelect: true }

// Disabled items are stops (WAI-ARIA APG, and Instrument's menu): a user who
// cannot reach an item never learns that the action exists. So the walk treats
// nothing as disabled, and wraps, as menus do.
const walk = { loop: true }

const TYPEAHEAD_IDLE = { buffer: '', at: 0 }

function landing(items: MenuItem[], focus: MenuOpenFocus): number {
  return focus === 'none' ? -1 : edgeEnabled(items, focus, walk)
}

/**
 * Open is decided by the owner in controlled mode, so where the highlight lands
 * cannot be decided by the request: it is decided when `open` actually moves,
 * from whatever the last request asked for.
 */
function settle(previous: MenuState, next: MenuState): MenuState {
  if (!previous.open && next.open) {
    const items = levelItems(next.items, [], 0)
    return { ...next, path: [landing(items, next.openFocus)], focusLevel: 0, grace: null, typeahead: TYPEAHEAD_IDLE }
  }
  if (previous.open && !next.open) {
    return { ...next, path: [], focusLevel: 0, grace: null, typeahead: TYPEAHEAD_IDLE }
  }
  return next
}

/**
 * Put the highlight on `index` in `level` and focus there. Moving to another
 * row closes whatever was open below the old one; staying on the same row keeps
 * its submenu.
 */
function highlightAt(state: MenuState, level: number, index: number): MenuState {
  const same = state.path[level] === index
  if (same && state.focusLevel === level) return state
  return {
    ...state,
    path: same ? state.path : [...state.path.slice(0, level), index],
    focusLevel: level,
    typeahead: level === state.focusLevel ? state.typeahead : TYPEAHEAD_IDLE,
  }
}

/** The keyboard moving within a level: always closes what was open below. */
function moveTo(state: MenuState, level: number, index: number): MenuState {
  if (state.path[level] === index && state.path.length === level + 1) return state
  return { ...state, path: [...state.path.slice(0, level), index], focusLevel: level }
}

/**
 * Open the submenu of row `index` in `level`. From the keyboard focus moves in,
 * onto its first row; from a pointer the submenu shows and focus stays on the
 * row, as on every desktop.
 */
function openSubmenu(state: MenuState, level: number, index: number, from: 'keyboard' | 'pointer'): MenuState {
  const row = levelItems(state.items, state.path, level)[index]
  if (!isSubmenu(row) || row.disabled) return state
  const alreadyOpen = state.path[level] === index && state.path.length > level + 1
  if (from === 'pointer') {
    if (alreadyOpen && state.focusLevel === level) return state
    const path = alreadyOpen ? state.path : [...state.path.slice(0, level), index, -1]
    return { ...state, path, focusLevel: level, typeahead: TYPEAHEAD_IDLE }
  }
  const first = landing(levelItems(row.items, [], 0), 'first')
  return { ...state, path: [...state.path.slice(0, level), index, first], focusLevel: level + 1, typeahead: TYPEAHEAD_IDLE, grace: null }
}

function closeSubmenu(state: MenuState): MenuState {
  if (state.focusLevel > 0) {
    const level = state.focusLevel - 1
    return { ...state, path: state.path.slice(0, level + 1), focusLevel: level, typeahead: TYPEAHEAD_IDLE, grace: null }
  }
  // A submenu the pointer opened, while focus is still on its row.
  if (state.path.length > 1) return { ...state, path: state.path.slice(0, 1), grace: null }
  return state
}

function select(state: MenuState, level: number, index: number, pointer: boolean): MenuState {
  const item = levelItems(state.items, state.path, level)[index]
  if (!item || item.disabled) return state
  if (isSubmenu(item)) return openSubmenu(state, level, index, pointer ? 'pointer' : 'keyboard')
  const checked = item.type === 'checkbox' ? !item.checked : item.type === 'radio' ? true : undefined
  const next: MenuState = {
    ...state,
    selection: checked === undefined
      ? { item, nonce: state.selection.nonce + 1 }
      : { item, checked, nonce: state.selection.nonce + 1 },
  }
  const close = item.closeOnSelect ?? state.closeOnSelect
  return close ? requestOpen<MenuChangeReason, MenuState>(next, false, 'select') : next
}

/** Fit the path to new items: an index past the end is clamped, and a row that is no longer a submenu cuts the path there. */
function repath(state: MenuState, items: MenuEntry[]): MenuState {
  if (!state.open) return { ...state, items }
  const path: number[] = []
  for (let level = 0; level < state.path.length; level++) {
    const rows = levelItems(items, path, level)
    if (level > 0 && rows.length === 0) break
    const index = clampIndex(state.path[level], rows.length)
    path.push(index)
    if (level < state.path.length - 1 && !isSubmenu(rows[index])) break
  }
  const focusLevel = Math.min(state.focusLevel, path.length - 1)
  return { ...state, items, path, focusLevel, grace: null }
}

function step(state: MenuState, event: MenuEvent): MenuState {
  switch (event.type) {
    case 'OPEN':
      if (state.open) return state
      return requestOpen({ ...state, openFocus: event.focus ?? 'none' }, true, event.reason ?? 'trigger')

    case 'CLOSE':
      return requestOpen(state, false, event.reason)

    case 'TOGGLE':
      return state.open
        ? requestOpen(state, false, event.reason ?? 'trigger')
        : requestOpen({ ...state, openFocus: event.focus ?? 'none' }, true, event.reason ?? 'trigger')

    case 'ESCAPE': {
      if (!state.open) return state
      const closed = closeSubmenu(state)
      return closed !== state ? closed : requestOpen<MenuChangeReason, MenuState>(state, false, 'escape')
    }

    case 'HIGHLIGHT': {
      const { level, index, pointer } = event
      if (!state.open || level >= state.path.length) return state
      const rows = levelItems(state.items, state.path, level)
      if (index < -1 || index >= rows.length) return state
      // Crossing sibling rows on the way to an open submenu is not choosing them.
      const { grace } = state
      if (pointer && grace && grace.level === level && index !== state.path[level] && pointer.now <= grace.until) {
        if (pointInPolygon(pointer, grace.polygon)) return state
      }
      const arrived = grace && level > grace.level ? { ...state, grace: null } : state
      const next = highlightAt(arrived, level, index)
      return pointer && isSubmenu(rows[index]) ? openSubmenu(next, level, index, 'pointer') : next
    }

    case 'UNHIGHLIGHT': {
      const { level, index } = event
      if (!state.open || state.path[level] !== index) return state
      // The row whose submenu is open keeps its highlight: the pointer is on its way there.
      if (state.path.length > level + 1) return state
      return { ...state, path: [...state.path.slice(0, level), -1], focusLevel: level }
    }

    case 'GRACE':
      if (!state.open || state.path.length <= event.grace.level + 1) return state
      return { ...state, grace: event.grace }

    case 'HIGHLIGHT_MOVE': {
      if (!state.open) return state
      const level = state.focusLevel
      return moveTo(state, level, nextEnabled(levelItems(state.items, state.path, level), state.path[level], event.step, walk))
    }

    case 'HIGHLIGHT_EDGE': {
      if (!state.open) return state
      const level = state.focusLevel
      return moveTo(state, level, edgeEnabled(levelItems(state.items, state.path, level), event.edge, walk))
    }

    case 'SUBMENU_OPEN':
      if (!state.open) return state
      return openSubmenu(state, state.focusLevel, state.path[state.focusLevel], 'keyboard')

    case 'SUBMENU_CLOSE':
      if (!state.open) return state
      return closeSubmenu(state)

    case 'SELECT': {
      if (!state.open) return state
      const level = event.level ?? state.focusLevel
      if (level >= state.path.length) return state
      return select(state, level, event.index ?? state.path[level], event.pointer ?? false)
    }

    case 'TYPE': {
      if (!state.open) return state
      const level = state.focusLevel
      const result = typeahead(levelItems(state.items, state.path, level), {
        char: event.char,
        now: event.now,
        state: state.typeahead,
        from: state.path[level],
        getText: (item) => item.label,
      })
      if (result.index === -1) return { ...state, typeahead: result.state }
      return { ...moveTo(state, level, result.index), typeahead: result.state }
    }

    case 'SYNC_OPEN':
      return syncOpen(state, event.open)

    case 'SYNC_ITEMS':
      return event.items === state.items ? state : repath(state, event.items)

    case 'SYNC_OPTIONS': {
      const { type: _type, ...options } = event
      return syncOptions(state, DEFAULTS, options)
    }
  }
}

/** Pure. Every transition, then the one rule about where the highlight lands. */
export function reducer(state: MenuState, event: MenuEvent): MenuState {
  const next = step(state, event)
  return next === state ? state : settle(state, next)
}

export interface MenuMachineConfig extends Partial<MenuOptions> {
  id: string
  items?: MenuEntry[]
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: MenuChangeDetails) => void
  onSelect?: (value: string, details: MenuSelectDetails) => void
}

export function initialState(config: MenuMachineConfig): MenuState {
  const opened = initialOpen(config, 'api' as const)
  return {
    id: config.id,
    items: config.items ?? [],
    ...opened,
    placement: config.placement ?? DEFAULTS.placement,
    closeOnSelect: config.closeOnSelect ?? DEFAULTS.closeOnSelect,
    path: opened.open ? [-1] : [],
    focusLevel: 0,
    openFocus: 'none',
    typeahead: TYPEAHEAD_IDLE,
    grace: null,
    selection: { item: null, nonce: 0 },
  }
}

/** onSelect's arguments when a selection happened between two states, or null. */
export function reportedSelection(previous: MenuState, next: MenuState): [string, MenuSelectDetails] | null {
  const { item, checked, nonce } = next.selection
  if (nonce === previous.selection.nonce || !item) return null
  return [item.value, checked === undefined ? { item } : { item, checked }]
}

export function createMenuMachine(config: MenuMachineConfig): Machine<MenuState, MenuEvent> {
  const machine = createMachine(initialState(config), reducer)
  return withEffects(machine, (previous, next) => {
    // The choice first, then the close it caused: an owner that reacts to the
    // close by moving focus has already acted on the item.
    const selected = reportedSelection(previous, next)
    if (selected) config.onSelect?.(...selected)
    if (next.intent.nonce !== previous.intent.nonce) {
      config.onOpenChange?.(next.intent.open, changeDetails(next.intent) as MenuChangeDetails)
    }
  })
}
