import { createMachine, withEffects, type Machine } from '../../machine'
import type { DialogChangeDetails, DialogChangeReason, DialogEvent, DialogOptions, DialogState } from './dialog.types'

export const DEFAULTS: DialogOptions = { modal: true, role: 'dialog', closeOnEscape: true, closeOnOutside: true }

/**
 * Open and close are the only transitions, and both go through intent: the
 * owner hears every request, and in controlled mode `open` moves only when the
 * owner answers with SYNC_OPEN.
 *
 * A request is judged against `open`, not against the last request. A
 * controlled owner may refuse a close by simply not changing its prop — no
 * answer arrives — and the next Escape must still be heard. The cost is that a
 * slow owner can be told twice; setting the same state twice is harmless.
 */
function request(state: DialogState, open: boolean, reason: DialogChangeReason, returnValue?: string): DialogState {
  if (state.open === open) return state
  const next = { ...state, intent: { open, reason, returnValue, nonce: state.intent.nonce + 1 } }
  return state.controlled ? next : { ...next, open }
}

export function reducer(state: DialogState, event: DialogEvent): DialogState {
  switch (event.type) {
    case 'OPEN':
      return request(state, true, event.reason ?? 'trigger')

    case 'CLOSE':
      return request(state, false, event.reason, event.returnValue)

    case 'SYNC_OPEN':
      // The owner's state. Not a request: nobody is told.
      return state.open === event.open ? state : { ...state, open: event.open }

    case 'SYNC_OPTIONS': {
      const { type: _type, ...options } = event
      const next = { ...state }
      let changed = false
      for (const key of Object.keys(DEFAULTS) as (keyof DialogOptions)[]) {
        // An absent option is its default, as in ChipGroup's SYNC_OPTIONS.
        const value = options[key] ?? DEFAULTS[key]
        if (next[key] !== value) {
          ;(next as Record<string, unknown>)[key] = value
          changed = true
        }
      }
      return changed ? next : state
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
  const controlled = config.open !== undefined
  const open = controlled ? Boolean(config.open) : Boolean(config.defaultOpen)
  return {
    id: config.id,
    open,
    controlled,
    intent: { open, reason: 'api', nonce: 0 },
    modal: config.modal ?? DEFAULTS.modal,
    role: config.role ?? DEFAULTS.role,
    closeOnEscape: config.closeOnEscape ?? DEFAULTS.closeOnEscape,
    closeOnOutside: config.closeOnOutside ?? DEFAULTS.closeOnOutside,
  }
}

export function createDialogMachine(config: DialogMachineConfig): Machine<DialogState, DialogEvent> {
  const machine = createMachine(initialState(config), reducer)
  return withEffects(machine, (previous, next) => {
    if (next.intent.nonce !== previous.intent.nonce) {
      const { reason, returnValue } = next.intent
      config.onOpenChange?.(next.intent.open, returnValue === undefined ? { reason } : { reason, returnValue })
    }
  })
}
