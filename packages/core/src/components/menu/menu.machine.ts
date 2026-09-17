import { createMachine, withEffects, type Machine } from '../../machine'
import { clampIndex, edgeEnabled, nextEnabled } from '../../utils/collection'
import { changeDetails, initialOpen, requestOpen, syncOpen, syncOptions } from '../../utils/open-intent'
import { typeahead } from '../../utils/typeahead'
import { flattenMenu } from './menu.collection'
import type { MenuChangeDetails, MenuChangeReason, MenuEntry, MenuEvent, MenuItem, MenuOpenFocus, MenuOptions, MenuSelectDetails, MenuState } from './menu.types'

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
    return { ...next, highlightedIndex: landing(flattenMenu(next.items), next.openFocus), typeahead: TYPEAHEAD_IDLE }
  }
  if (previous.open && !next.open) {
    return { ...next, highlightedIndex: -1, typeahead: TYPEAHEAD_IDLE }
  }
  return next
}

function select(state: MenuState, index: number): MenuState {
  const item = flattenMenu(state.items)[index]
  if (!item || item.disabled) return state
  const checked = item.type === 'checkbox' ? !item.checked : item.type === 'radio' ? true : undefined
  const next: MenuState = {
    ...state,
    highlightedIndex: index,
    selection: checked === undefined
      ? { item, nonce: state.selection.nonce + 1 }
      : { item, checked, nonce: state.selection.nonce + 1 },
  }
  const close = item.closeOnSelect ?? state.closeOnSelect
  return close ? requestOpen<MenuChangeReason, MenuState>(next, false, 'select') : next
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

    case 'HIGHLIGHT': {
      if (!state.open || event.index === state.highlightedIndex) return state
      const size = flattenMenu(state.items).length
      if (event.index < -1 || event.index >= size) return state
      return { ...state, highlightedIndex: event.index }
    }

    case 'HIGHLIGHT_MOVE': {
      if (!state.open) return state
      const next = nextEnabled(flattenMenu(state.items), state.highlightedIndex, event.step, walk)
      return next === state.highlightedIndex ? state : { ...state, highlightedIndex: next }
    }

    case 'HIGHLIGHT_EDGE': {
      if (!state.open) return state
      const next = edgeEnabled(flattenMenu(state.items), event.edge, walk)
      return next === state.highlightedIndex ? state : { ...state, highlightedIndex: next }
    }

    case 'SELECT':
      if (!state.open) return state
      return select(state, event.index ?? state.highlightedIndex)

    case 'TYPE': {
      if (!state.open) return state
      const result = typeahead(flattenMenu(state.items), {
        char: event.char,
        now: event.now,
        state: state.typeahead,
        from: state.highlightedIndex,
        getText: (item) => item.label,
      })
      return result.index === -1
        ? { ...state, typeahead: result.state }
        : { ...state, highlightedIndex: result.index, typeahead: result.state }
    }

    case 'SYNC_OPEN':
      return syncOpen(state, event.open)

    case 'SYNC_ITEMS': {
      if (event.items === state.items) return state
      const size = flattenMenu(event.items).length
      return { ...state, items: event.items, highlightedIndex: clampIndex(state.highlightedIndex, size) }
    }

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
  return {
    id: config.id,
    items: config.items ?? [],
    ...initialOpen(config, 'api' as const),
    placement: config.placement ?? DEFAULTS.placement,
    closeOnSelect: config.closeOnSelect ?? DEFAULTS.closeOnSelect,
    highlightedIndex: -1,
    openFocus: 'none',
    typeahead: TYPEAHEAD_IDLE,
    selection: { item: null, nonce: 0 },
  }
}

export function createMenuMachine(config: MenuMachineConfig): Machine<MenuState, MenuEvent> {
  const machine = createMachine(initialState(config), reducer)
  return withEffects(machine, (previous, next) => {
    // The choice first, then the close it caused: an owner that reacts to the
    // close by moving focus has already acted on the item.
    const { item, checked, nonce } = next.selection
    if (nonce !== previous.selection.nonce && item) {
      config.onSelect?.(item.value, checked === undefined ? { item } : { item, checked })
    }
    if (next.intent.nonce !== previous.intent.nonce) {
      config.onOpenChange?.(next.intent.open, changeDetails(next.intent) as MenuChangeDetails)
    }
  })
}
