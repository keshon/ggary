import { createMachine, withEffects, type Machine } from '../../machine'
import { changeDetails, initialOpen, requestOpen, syncOpen, syncOptions } from '../../utils/open-intent'
import type { PopoverChangeDetails, PopoverEvent, PopoverOptions, PopoverState } from './popover.types'

export const DEFAULTS: PopoverOptions = { placement: 'bottom-start', closeOnEscape: true, closeOnOutside: true }

export function reducer(state: PopoverState, event: PopoverEvent): PopoverState {
  switch (event.type) {
    case 'OPEN':
      return requestOpen(state, true, event.reason ?? 'trigger')
    case 'CLOSE':
      return requestOpen(state, false, event.reason)
    case 'TOGGLE':
      return requestOpen(state, !state.open, event.reason ?? 'trigger')
    case 'SYNC_OPEN':
      return syncOpen(state, event.open)
    case 'SYNC_OPTIONS': {
      const { type: _type, ...options } = event
      return syncOptions(state, DEFAULTS, options)
    }
  }
}

export interface PopoverMachineConfig extends Partial<PopoverOptions> {
  id: string
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: PopoverChangeDetails) => void
}

export function initialState(config: PopoverMachineConfig): PopoverState {
  return {
    id: config.id,
    ...initialOpen(config, 'api' as const),
    placement: config.placement ?? DEFAULTS.placement,
    closeOnEscape: config.closeOnEscape ?? DEFAULTS.closeOnEscape,
    closeOnOutside: config.closeOnOutside ?? DEFAULTS.closeOnOutside,
  }
}

export function createPopoverMachine(config: PopoverMachineConfig): Machine<PopoverState, PopoverEvent> {
  const machine = createMachine(initialState(config), reducer)
  return withEffects(machine, (previous, next) => {
    if (next.intent.nonce !== previous.intent.nonce) {
      config.onOpenChange?.(next.intent.open, changeDetails(next.intent) as PopoverChangeDetails)
    }
  })
}
