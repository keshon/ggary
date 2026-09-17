import { createMachine, withEffects, type Machine } from '../../machine'
import { edgeEnabled, nearestEnabled, nextEnabled } from '../../utils/collection'
import { syncOptions } from '../../utils/open-intent'
import type { TabItem, TabsEvent, TabsOptions, TabsState } from './tabs.types'

export const DEFAULTS: TabsOptions = { orientation: 'horizontal', activation: 'automatic' }

// Tabs wrap (APG) and never land on a disabled tab.
const walk = { loop: true, isDisabled: (item: TabItem) => !!item.disabled }

const indexOf = (items: TabItem[], value: string | null) => (value == null ? -1 : items.findIndex((item) => item.value === value))
const selectable = (items: TabItem[], value: string | null) => {
  const item = items[indexOf(items, value)]
  return !!item && !item.disabled
}

/** Select `value`: always heard as intent, moved only when uncontrolled. */
function commit(state: TabsState, value: string | null): TabsState {
  const next = { ...state, intent: { value, nonce: state.intent.nonce + 1 } }
  return state.controlled ? next : { ...next, value }
}

function moveFocus(state: TabsState, index: number): TabsState {
  const target = state.items[index]
  if (!target) return state
  const moved = { ...state, focus: { value: target.value, nonce: state.focus.nonce + 1 } }
  // Automatic activation: arriving is choosing.
  return state.activation === 'automatic' && target.value !== state.value ? commit(moved, target.value) : moved
}

export function reducer(state: TabsState, event: TabsEvent): TabsState {
  switch (event.type) {
    case 'SELECT': {
      if (!selectable(state.items, event.value)) return state
      const focused = event.value === state.focus.value ? state : { ...state, focus: { value: event.value, nonce: state.focus.nonce } }
      // Re-selecting the selected tab is not a change.
      return event.value === state.value ? focused : commit(focused, event.value)
    }

    case 'FOCUS':
      if (event.value === state.focus.value || indexOf(state.items, event.value) === -1) return state
      return { ...state, focus: { value: event.value, nonce: state.focus.nonce } }

    case 'MOVE': {
      const from = indexOf(state.items, state.focus.value ?? state.value)
      const next = nextEnabled(state.items, from, event.step, walk)
      return next === -1 || next === from ? state : moveFocus(state, next)
    }

    case 'EDGE': {
      const next = edgeEnabled(state.items, event.edge, walk)
      return next === -1 || state.items[next].value === state.focus.value ? state : moveFocus(state, next)
    }

    case 'ACTIVATE': {
      const value = state.focus.value
      if (!selectable(state.items, value) || value === state.value) return state
      return commit(state, value)
    }

    case 'CLOSE': {
      const value = event.value ?? state.focus.value
      const index = indexOf(state.items, value)
      const item = state.items[index]
      if (!item?.closable || item.disabled) return state
      const closing = { value: item.value, nonce: state.closing.nonce + 1 }
      // Pre-aim focus at the tab that will stand in this one's place, against
      // the list as it will be. Only when focus is on the tab that closes: a
      // close button pressed on a background tab leaves focus where it is.
      if (state.focus.value !== item.value) return { ...state, closing }
      const remaining = state.items.filter((_, i) => i !== index)
      const landing = remaining[nearestEnabled(remaining, index, walk)]
      return { ...state, closing, focus: { value: landing?.value ?? null, nonce: state.focus.nonce + 1 } }
    }

    case 'SYNC_VALUE': {
      if (event.value === state.value) return state
      return { ...state, value: event.value, focus: { value: event.value, nonce: state.focus.nonce } }
    }

    case 'SYNC_ITEMS': {
      if (event.items === state.items) return state
      let next: TabsState = { ...state, items: event.items }
      // The selected tab went away: its neighbour takes its place, as an
      // editor's does, and the owner hears it.
      if (state.value !== null && !selectable(event.items, state.value)) {
        const old = Math.max(0, indexOf(state.items, state.value))
        const landing = event.items[nearestEnabled(event.items, old, walk)]?.value ?? null
        next = commit(next, landing)
      } else if (state.value === null && !state.controlled) {
        // Items arrived after construction.
        const first = event.items[edgeEnabled(event.items, 'first', walk)]?.value ?? null
        if (first !== null) next = { ...next, value: first }
      }
      // Keep the focus nonce: a move queued by CLOSE has to survive the list change it asked for.
      if (indexOf(event.items, next.focus.value) === -1) {
        next = { ...next, focus: { value: next.value, nonce: next.focus.nonce } }
      }
      return next
    }

    case 'SYNC_OPTIONS': {
      const { type: _type, ...options } = event
      return syncOptions(state, DEFAULTS, options)
    }
  }
}

export interface TabsMachineConfig extends Partial<TabsOptions> {
  id: string
  items?: TabItem[]
  /** Pass `value` for controlled mode; `defaultValue` for uncontrolled. Default: the first enabled tab. */
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string) => void
  /** A close button, Delete or a middle click asked to close this tab. Remove it from `items` to close it. */
  onClose?: (value: string) => void
}

export function initialState(config: TabsMachineConfig): TabsState {
  const items = config.items ?? []
  const controlled = config.value !== undefined
  const wanted = controlled ? config.value ?? null : config.defaultValue ?? null
  const value = controlled || selectable(items, wanted) ? wanted : items[edgeEnabled(items, 'first', walk)]?.value ?? null
  return {
    id: config.id,
    items,
    value,
    controlled,
    orientation: config.orientation ?? DEFAULTS.orientation,
    activation: config.activation ?? DEFAULTS.activation,
    // nonce 0: never asked to move focus.
    focus: { value, nonce: 0 },
    intent: { value, nonce: 0 },
    closing: { value: null, nonce: 0 },
  }
}

export function createTabsMachine(config: TabsMachineConfig): Machine<TabsState, TabsEvent> {
  const machine = createMachine(initialState(config), reducer)
  return withEffects(machine, (previous, next) => {
    if (next.closing.nonce !== previous.closing.nonce && next.closing.value !== null) {
      config.onClose?.(next.closing.value)
    }
    if (next.intent.nonce !== previous.intent.nonce && next.intent.value !== null) {
      config.onValueChange?.(next.intent.value)
    }
  })
}
