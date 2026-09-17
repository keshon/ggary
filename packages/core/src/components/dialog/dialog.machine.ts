import { createMachine, withEffects, type Machine } from '../../machine'
import { changeDetails, initialOpen, requestOpen, syncOpen, syncOptions } from '../../utils/open-intent'
import type { DialogChangeDetails, DialogEvent, DialogOptions, DialogState } from './dialog.types'

export const DEFAULTS: DialogOptions = { modal: true, role: 'dialog', closeOnEscape: true, closeOnOutside: true }

/** Open and close go through intent; the rule lives in utils/open-intent, shared with Popover and Tooltip. */
export function reducer(state: DialogState, event: DialogEvent): DialogState {
  switch (event.type) {
    case 'OPEN':
      return requestOpen(state, true, event.reason ?? 'trigger')
    case 'CLOSE':
      return requestOpen(state, false, event.reason, event.returnValue)
    case 'SYNC_OPEN':
      return syncOpen(state, event.open)
    case 'SYNC_OPTIONS': {
      const { type: _type, ...options } = event
      return syncOptions(state, DEFAULTS, options)
    }
  }
}

export interface DialogMachineConfig extends Partial<DialogOptions> {
  id: string
  /** Controlled when defined. */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: DialogChangeDetails) => void
}

export function initialState(config: DialogMachineConfig): DialogState {
  return {
    id: config.id,
    ...initialOpen(config, 'api' as const),
    modal: config.modal ?? DEFAULTS.modal,
    role: config.role ?? DEFAULTS.role,
    closeOnEscape: config.closeOnEscape ?? DEFAULTS.closeOnEscape,
    closeOnOutside: config.closeOnOutside ?? DEFAULTS.closeOnOutside,
  }
}

export function createDialogMachine(config: DialogMachineConfig): Machine<DialogState, DialogEvent> {
  const machine = createMachine(initialState(config), reducer)
  return withEffects(machine, (previous, next) => {
    if (next.intent.nonce !== previous.intent.nonce) config.onOpenChange?.(next.intent.open, changeDetails(next.intent))
  })
}
