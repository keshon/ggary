import { createMachine, withEffects, type Machine } from '../../machine'
import { changeDetails, initialOpen, requestOpen, syncOpen, syncOptions } from '../../utils/open-intent'
import type { ShellChangeDetails, ShellChangeReason, ShellEvent, ShellOptions, ShellState } from './shell.types'

export const DEFAULTS: ShellOptions = { collapse: 'drawer' }

export function reducer(state: ShellState, event: ShellEvent): ShellState {
  switch (event.type) {
    case 'OPEN':
      return requestOpen(state, true, event.reason ?? 'toggle')
    case 'CLOSE':
      return requestOpen(state, false, event.reason)
    case 'TOGGLE':
      return requestOpen(state, !state.open, event.reason ?? 'toggle')
    case 'SYNC_OPEN':
      return syncOpen(state, event.open)
    case 'SYNC_OPTIONS': {
      const { type: _type, ...options } = event
      const next = syncOptions(state, DEFAULTS, options)
      // A bar has no drawer to be open.
      return next.collapse === 'bar' && next.open ? { ...next, open: false } : next
    }
  }
}

export interface ShellMachineConfig extends Partial<ShellOptions> {
  id: string
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: ShellChangeDetails) => void
}

export function initialState(config: ShellMachineConfig): ShellState {
  return {
    id: config.id,
    ...initialOpen<ShellChangeReason>(config, 'api'),
    collapse: config.collapse ?? DEFAULTS.collapse,
  }
}

export function createShellMachine(config: ShellMachineConfig): Machine<ShellState, ShellEvent> {
  const machine = createMachine(initialState(config), reducer)
  return withEffects(machine, (previous, next) => {
    if (next.intent.nonce !== previous.intent.nonce) {
      config.onOpenChange?.(next.intent.open, changeDetails(next.intent) as ShellChangeDetails)
    }
  })
}
