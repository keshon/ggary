import { createMachine, withEffects, type Machine } from '../../machine'
import { edgeEnabled, nextEnabled } from '../../utils/collection'
import { syncOptions } from '../../utils/open-intent'
import type { AccordionEvent, AccordionItem, AccordionOptions, AccordionState } from './accordion.types'

const DEFAULTS: AccordionOptions = { multiple: false, collapsible: true, disabled: false }

export const isDisabled = (state: Pick<AccordionState, 'disabled'>, item: AccordionItem | undefined) => !item || state.disabled || !!item.disabled
const indexOf = (items: AccordionItem[], value: string | null) => (value == null ? -1 : items.findIndex((item) => item.value === value))
// Up and Down loop past the ends, as in the APG's example, and pass over a disabled section.
const walk = (state: AccordionState) => ({ loop: true, isDisabled: (item: AccordionItem) => isDisabled(state, item) })

function commit(state: AccordionState, value: string[]): AccordionState {
  const next = { ...state, intent: { value, nonce: state.intent.nonce + 1 } }
  return state.controlled ? next : { ...next, value }
}

/** Whether a press on this open section would close it. */
export const canClose = (state: AccordionState, value: string) => state.multiple || state.collapsible || !state.value.includes(value)

export function reducer(state: AccordionState, event: AccordionEvent): AccordionState {
  switch (event.type) {
    case 'TOGGLE': {
      const item = state.items[indexOf(state.items, event.value)]
      if (isDisabled(state, item)) return state
      const open = state.value.includes(event.value)
      if (open) return canClose(state, event.value) ? commit(state, state.value.filter((value) => value !== event.value)) : state
      return commit(state, state.multiple ? [...state.value, event.value] : [event.value])
    }
    case 'REVEAL': {
      if (state.value.includes(event.value) || indexOf(state.items, event.value) === -1) return state
      return commit(state, state.multiple ? [...state.value, event.value] : [event.value])
    }
    case 'FOCUS':
      if (event.value === state.focus.value || indexOf(state.items, event.value) === -1) return state
      return { ...state, focus: { value: event.value, nonce: state.focus.nonce } }
    case 'MOVE': {
      const from = indexOf(state.items, state.focus.value)
      const next = nextEnabled(state.items, from, event.step, walk(state))
      if (next === -1 || next === from) return state
      return { ...state, focus: { value: state.items[next].value, nonce: state.focus.nonce + 1 } }
    }
    case 'EDGE': {
      const next = edgeEnabled(state.items, event.edge, walk(state))
      if (next === -1 || state.items[next].value === state.focus.value) return state
      return { ...state, focus: { value: state.items[next].value, nonce: state.focus.nonce + 1 } }
    }
    case 'SYNC_VALUE':
      return event.value.length === state.value.length && event.value.every((value, i) => value === state.value[i]) ? state : { ...state, value: event.value }
    case 'SYNC_ITEMS':
      return event.items === state.items ? state : { ...state, items: event.items }
    case 'SYNC_OPTIONS': {
      const { type: _type, ...options } = event
      return syncOptions(state, DEFAULTS, options)
    }
  }
}

export interface AccordionMachineConfig extends Partial<AccordionOptions> {
  id: string
  items?: AccordionItem[]
  /** Controlled: the open sections. Omit and use `defaultValue` for uncontrolled. */
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
}

export function initialState(config: AccordionMachineConfig): AccordionState {
  const controlled = config.value !== undefined
  const value = (controlled ? config.value : config.defaultValue) ?? []
  return {
    id: config.id,
    items: config.items ?? [],
    value,
    controlled,
    multiple: config.multiple ?? DEFAULTS.multiple,
    collapsible: config.collapsible ?? DEFAULTS.collapsible,
    disabled: config.disabled ?? DEFAULTS.disabled,
    focus: { value: null, nonce: 0 },
    intent: { value, nonce: 0 },
  }
}

export function createAccordionMachine(config: AccordionMachineConfig): Machine<AccordionState, AccordionEvent> {
  const machine = createMachine(initialState(config), reducer)
  return withEffects(machine, (previous, next) => {
    if (next.intent.nonce !== previous.intent.nonce) config.onValueChange?.(next.intent.value)
  })
}
