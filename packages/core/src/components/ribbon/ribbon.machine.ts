import { createMachine, withEffects, type Machine } from '../../machine'
import { edgeEnabled, nearestEnabled, nextEnabled } from '../../utils/collection'
import type { RibbonEvent, RibbonItem, RibbonState } from './ribbon.types'

// Ribbon tabs wrap and never land on a disabled tab, as Tabs' do (APG).
const walk = { loop: true, isDisabled: (item: RibbonItem) => !!item.disabled }

const indexOf = (items: RibbonItem[], value: string | null) => (value == null ? -1 : items.findIndex((item) => item.value === value))
const selectable = (items: RibbonItem[], value: string | null) => {
  const item = items[indexOf(items, value)]
  return !!item && !item.disabled
}

/** Select `value`: always heard as intent, moved only when uncontrolled. */
function commit(state: RibbonState, value: string | null): RibbonState {
  const next = { ...state, intent: { value, nonce: state.intent.nonce + 1 } }
  return state.controlled ? next : { ...next, value }
}

/** Arriving is choosing: the ribbon has no manual activation. */
function moveFocus(state: RibbonState, index: number): RibbonState {
  const target = state.items[index]
  if (!target) return state
  const moved = { ...state, focus: { value: target.value, nonce: state.focus.nonce + 1 } }
  return target.value !== state.value && !target.disabled ? commit(moved, target.value) : moved
}

export function reducer(state: RibbonState, event: RibbonEvent): RibbonState {
  switch (event.type) {
    case 'SELECT': {
      if (!selectable(state.items, event.value)) return state
      const focused = event.value === state.focus.value ? state : { ...state, focus: { value: event.value, nonce: state.focus.nonce } }
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

    case 'SYNC_VALUE': {
      if (event.value === state.value) return state
      return { ...state, value: event.value, focus: { value: event.value, nonce: state.focus.nonce } }
    }

    case 'SYNC_ITEMS': {
      if (event.items === state.items) return state
      let next: RibbonState = { ...state, items: event.items }
      if (state.value !== null && !selectable(event.items, state.value)) {
        const old = Math.max(0, indexOf(state.items, state.value))
        const landing = event.items[nearestEnabled(event.items, old, walk)]?.value ?? null
        next = commit(next, landing)
      } else if (state.value === null && !state.controlled) {
        const first = event.items[edgeEnabled(event.items, 'first', walk)]?.value ?? null
        if (first !== null) next = { ...next, value: first }
      }
      if (indexOf(event.items, next.focus.value) === -1) {
        next = { ...next, focus: { value: next.value, nonce: next.focus.nonce } }
      }
      return next
    }
  }
}

export interface RibbonMachineConfig {
  id: string
  items?: RibbonItem[]
  /** Pass `value` for controlled mode; `defaultValue` for uncontrolled. Default: the first enabled tab. */
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string) => void
}

export function initialState(config: RibbonMachineConfig): RibbonState {
  const items = config.items ?? []
  const controlled = config.value !== undefined
  const wanted = controlled ? config.value ?? null : config.defaultValue ?? null
  const value = controlled || selectable(items, wanted) ? wanted : items[edgeEnabled(items, 'first', walk)]?.value ?? null
  return {
    id: config.id,
    items,
    value,
    controlled,
    // nonce 0: never asked to move focus.
    focus: { value, nonce: 0 },
    intent: { value, nonce: 0 },
  }
}

export function createRibbonMachine(config: RibbonMachineConfig): Machine<RibbonState, RibbonEvent> {
  const machine = createMachine(initialState(config), reducer)
  return withEffects(machine, (previous, next) => {
    if (next.intent.nonce !== previous.intent.nonce && next.intent.value !== null) {
      config.onValueChange?.(next.intent.value)
    }
  })
}
