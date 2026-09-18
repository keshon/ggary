import { createMachine, withEffects, type Machine } from '../../machine'
import { syncOptions } from '../../utils/open-intent'
import type { SplitEvent, SplitOptions, SplitState } from './split.types'

export const DEFAULTS: SplitOptions = {
  orientation: 'horizontal',
  primary: 'start',
  min: 160,
  max: 640,
  step: 16,
  collapsible: false,
  defaultSize: 320,
}

/** Within the pane's bounds, and within what the frame leaves when the other pane keeps its minimum. */
export function clampSize(state: Pick<SplitState, 'min' | 'max'>, size: number, limit?: number): number {
  const max = limit === undefined ? state.max : Math.max(state.min, Math.min(state.max, limit))
  return Math.round(Math.min(max, Math.max(state.min, size)))
}

const withSize = (state: SplitState, size: number, limit?: number): SplitState => {
  const next = clampSize(state, size, limit)
  return next === state.size && !state.collapsed ? state : { ...state, size: next, collapsed: false }
}

export function reducer(state: SplitState, event: SplitEvent): SplitState {
  switch (event.type) {
    case 'SET_SIZE':
      // A drag well under the minimum folds a collapsible pane rather than
      // stopping at a minimum the person is plainly trying to get past.
      if (state.collapsible && event.reason === 'pointer' && event.size < state.min / 2) {
        return state.collapsed ? state : { ...state, collapsed: true }
      }
      return withSize(state, event.size, event.limit)
    case 'STEP':
      if (state.collapsed) return event.delta > 0 ? { ...state, collapsed: false } : state
      return withSize(state, state.size + event.delta, event.limit)
    case 'TO_MIN':
      return withSize(state, state.min)
    case 'TO_MAX':
      return withSize(state, state.max, event.limit)
    case 'COLLAPSE':
      return !state.collapsible || state.collapsed ? state : { ...state, collapsed: true }
    case 'EXPAND':
      return state.collapsed ? { ...state, collapsed: false } : state
    case 'TOGGLE_COLLAPSE':
      if (!state.collapsible) return state
      return { ...state, collapsed: !state.collapsed }
    case 'RESET':
      return withSize(state, state.defaultSize)
    case 'SYNC_SIZE':
      return withSize(state, event.size)
    case 'SYNC_OPTIONS': {
      const { type: _type, ...options } = event
      const next = syncOptions(state, DEFAULTS, options)
      if (next === state) return state
      const size = clampSize(next, next.size)
      return { ...next, size, collapsed: next.collapsible && next.collapsed }
    }
  }
}

export interface SplitMachineConfig extends Partial<SplitOptions> {
  id: string
  /** The starting size; a stored one, say. Defaults to `defaultSize`. */
  size?: number
  collapsed?: boolean
  /** Every change of size or fold, for a page that keeps the layout. */
  onSizeChange?: (size: number, details: { collapsed: boolean }) => void
}

export function initialState(config: SplitMachineConfig): SplitState {
  const options: SplitOptions = {
    orientation: config.orientation ?? DEFAULTS.orientation,
    primary: config.primary ?? DEFAULTS.primary,
    min: config.min ?? DEFAULTS.min,
    max: config.max ?? DEFAULTS.max,
    step: config.step ?? DEFAULTS.step,
    collapsible: config.collapsible ?? DEFAULTS.collapsible,
    defaultSize: config.defaultSize ?? DEFAULTS.defaultSize,
  }
  return {
    id: config.id,
    ...options,
    size: clampSize(options, config.size ?? options.defaultSize),
    collapsed: Boolean(options.collapsible && config.collapsed),
  }
}

export function createSplitMachine(config: SplitMachineConfig): Machine<SplitState, SplitEvent> {
  const machine = createMachine(initialState(config), reducer)
  return withEffects(machine, (previous, next) => {
    if (next.size !== previous.size || next.collapsed !== previous.collapsed) {
      config.onSizeChange?.(next.size, { collapsed: next.collapsed })
    }
  })
}
