import { createMachine, withEffects, type Machine } from '../../machine'
import { clampIndex, edgeEnabled, nextEnabled } from '../../utils/collection'
import { typeahead } from '../../utils/typeahead'
import type { SelectEvent, SelectItem, SelectState } from './select.types'

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

const enabled = (item: SelectItem | undefined) => !!item && !item.disabled

const indexOfValue = (items: SelectItem[], value: string | null) =>
  value == null ? -1 : items.findIndex((item) => item.value === value)

// Select clamps at the ends: arrowing past the last option should not wrap round
// to the first, because a native <select> does not.
const collection = { isDisabled: (item: SelectItem) => !!item.disabled, loop: false }

const edgeIndex = (items: SelectItem[], edge: 'first' | 'last') => edgeEnabled(items, edge, collection)
const moveIndex = (items: SelectItem[], from: number, step: number) => nextEnabled(items, from, step, collection)

/** Where the highlight lands when the listbox opens. */
function openIndex(state: SelectState, focus: 'first' | 'last' | 'selected'): number {
  if (focus !== 'selected') return edgeIndex(state.items, focus)
  const selected = indexOfValue(state.items, state.value)
  return enabled(state.items[selected]) ? selected : edgeIndex(state.items, 'first')
}

/**
 * Every user-initiated value change goes through here, controlled or not.
 *
 * `intent` always advances — that is what the owner listens to. `value` advances
 * only when the machine owns it. Controlled mode is then exactly one branch,
 * and the adapters need no mode-specific code at all.
 */
function commitValue(state: SelectState, index: number): SelectState {
  const value = state.items[index].value
  const next = { ...state, highlightedIndex: index, intent: { value, nonce: state.intent.nonce + 1 } }
  return state.controlled ? next : { ...next, value }
}

function commitClear(state: SelectState): SelectState {
  const next = { ...state, intent: { value: null, nonce: state.intent.nonce + 1 } }
  return state.controlled ? next : { ...next, value: null, highlightedIndex: -1 }
}

// ---------------------------------------------------------------------------
// The reducer. Pure. No DOM. Every transition visible in one place.
// ---------------------------------------------------------------------------

export function reducer(state: SelectState, event: SelectEvent): SelectState {
  switch (event.type) {
    case 'OPEN': {
      if (state.open || state.disabled) return state
      return { ...state, open: true, highlightedIndex: openIndex(state, event.focus ?? 'selected') }
    }

    case 'CLOSE': {
      if (!state.open) return state
      return { ...state, open: false, typeahead: { buffer: '', at: 0 } }
    }

    case 'TOGGLE':
      return reducer(state, state.open ? { type: 'CLOSE' } : { type: 'OPEN' })

    case 'HIGHLIGHT': {
      if (event.index === state.highlightedIndex) return state
      if (event.index !== -1 && !enabled(state.items[event.index])) return state
      return { ...state, highlightedIndex: event.index }
    }

    case 'HIGHLIGHT_MOVE': {
      if (state.disabled) return state
      // Arrow keys on a CLOSED trigger change the value directly. That is native
      // <select> behaviour, and the reason this is not just "open, then move".
      if (!state.open) {
        const from = indexOfValue(state.items, state.value)
        const next = moveIndex(state.items, from, event.step)
        if (next === -1 || next === from) return state
        return commitValue(state, next)
      }
      const next = moveIndex(state.items, state.highlightedIndex, event.step)
      return next === state.highlightedIndex ? state : { ...state, highlightedIndex: next }
    }

    case 'HIGHLIGHT_EDGE': {
      const next = edgeIndex(state.items, event.edge)
      if (next === -1) return state
      if (!state.open) return next === indexOfValue(state.items, state.value) ? state : commitValue(state, next)
      return next === state.highlightedIndex ? state : { ...state, highlightedIndex: next }
    }

    case 'SELECT': {
      const index = event.index ?? state.highlightedIndex
      if (!enabled(state.items[index])) return state
      return { ...commitValue(state, index), open: false, typeahead: { buffer: '', at: 0 } }
    }

    case 'CLEAR': {
      if (state.value == null) return state
      return commitClear(state)
    }

    case 'TYPE': {
      if (state.disabled) return state
      const from = state.open ? state.highlightedIndex : indexOfValue(state.items, state.value)
      const result = typeahead(state.items, {
        char: event.char,
        now: event.now,
        state: state.typeahead,
        from,
        getText: (item) => item.label,
        isDisabled: (item) => !!item.disabled,
      })
      if (result.index === -1) return { ...state, typeahead: result.state }
      const next = state.open
        ? { ...state, highlightedIndex: result.index }
        : commitValue(state, result.index)
      return { ...next, typeahead: result.state }
    }

    case 'SYNC_VALUE': {
      if (event.value === state.value) return state
      return { ...state, value: event.value, highlightedIndex: indexOfValue(state.items, event.value) }
    }

    case 'SYNC_ITEMS': {
      if (event.items === state.items) return state
      return { ...state, items: event.items, highlightedIndex: clampIndex(state.highlightedIndex, event.items.length) }
    }

    case 'SYNC_DISABLED': {
      if (event.disabled === state.disabled) return state
      return { ...state, disabled: event.disabled, open: event.disabled ? false : state.open }
    }

    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export interface SelectConfig {
  id: string
  items?: SelectItem[]
  /** Pass `value` for controlled mode; pass `defaultValue` for uncontrolled. */
  value?: string | null
  defaultValue?: string | null
  disabled?: boolean
  onValueChange?: (value: string | null, item: SelectItem | null) => void
  onOpenChange?: (open: boolean) => void
}

export function initialState(config: SelectConfig): SelectState {
  const items = config.items ?? []
  const controlled = config.value !== undefined
  const value = controlled ? config.value ?? null : config.defaultValue ?? null
  return {
    id: config.id,
    items,
    open: false,
    value,
    highlightedIndex: indexOfValue(items, value),
    disabled: config.disabled ?? false,
    controlled,
    typeahead: { buffer: '', at: 0 },
    intent: { value, nonce: 0 },
  }
}

export function createSelectMachine(config: SelectConfig): Machine<SelectState, SelectEvent> {
  const base = createMachine<SelectState, SelectEvent>(initialState(config), reducer)

  // Callbacks live here so the reducer stays pure and the adapters stay dumb.
  return withEffects(base, (previous, next) => {
    if (previous.open !== next.open) config.onOpenChange?.(next.open)

    // Fire on INTENT, never on `value`. A SYNC_VALUE from the owner moves
    // `value` but not `intent`, so pushing a value in cannot echo back out.
    if (previous.intent.nonce !== next.intent.nonce) {
      const item = next.items.find((i) => i.value === next.intent.value) ?? null
      config.onValueChange?.(next.intent.value, item)
    }
  })
}
