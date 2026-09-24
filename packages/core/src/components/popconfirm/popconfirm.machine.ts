import { createMachine, withEffects, type Machine } from '../../machine'
import { changeDetails, initialOpen, requestOpen, syncOptions } from '../../utils/open-intent'
import type { PopconfirmChangeDetails, PopconfirmEvent, PopconfirmOptions, PopconfirmState } from './popconfirm.types'

export const DEFAULTS: PopconfirmOptions = { placement: 'bottom-start' }

export function reducer(state: PopconfirmState, event: PopconfirmEvent): PopconfirmState {
  switch (event.type) {
    case 'OPEN': {
      const next = requestOpen(state, true, event.reason ?? 'trigger')
      return next === state ? state : { ...next, error: null }
    }
    case 'TOGGLE':
      return reducer(state, state.open ? { type: 'CLOSE', reason: event.reason ?? 'trigger' } : { type: 'OPEN', reason: event.reason })
    case 'CLOSE': {
      // Closing abandons an attempt under way: its answer, when it comes, is not taken.
      const next = requestOpen(state, false, event.reason)
      return next === state ? state : { ...next, pending: false }
    }
    case 'CONFIRM':
      if (state.pending || !state.open) return state
      return { ...state, pending: true, error: null, attempt: state.attempt + 1 }
    case 'SETTLED':
      if (!state.pending || event.attempt !== state.attempt) return state
      if (event.ok) return { ...requestOpen<PopconfirmState['intent']['reason'], PopconfirmState>(state, false, 'confirm'), pending: false }
      return { ...state, pending: false, error: event.message ?? '' }
    case 'SYNC_OPTIONS': {
      const { type: _type, ...options } = event
      return syncOptions(state, DEFAULTS, options)
    }
  }
}

export interface PopconfirmMachineConfig extends Partial<PopconfirmOptions> {
  id: string
  defaultOpen?: boolean
  /** The action. A promise keeps the question open, busy, until it settles; a rejection's message is shown. */
  onConfirm?: () => unknown
  /** Called when it closes any way but by the action: the safe answer, Escape, a press outside. */
  onCancel?: () => void
  onOpenChange?: (open: boolean, details: PopconfirmChangeDetails) => void
}

export function initialState(config: PopconfirmMachineConfig): PopconfirmState {
  return {
    id: config.id,
    ...initialOpen({ defaultOpen: config.defaultOpen }, 'api' as const),
    placement: config.placement ?? DEFAULTS.placement,
    pending: false,
    error: null,
    attempt: 0,
  }
}

const messageOf = (reason: unknown) =>
  reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : undefined

export function createPopconfirmMachine(config: PopconfirmMachineConfig): Machine<PopconfirmState, PopconfirmEvent> {
  const base = createMachine(initialState(config), reducer)
  const machine: Machine<PopconfirmState, PopconfirmEvent> = withEffects(base, (previous, next) => {
    if (next.attempt !== previous.attempt) {
      const attempt = next.attempt
      let result: unknown
      try {
        result = config.onConfirm?.()
      } catch (reason) {
        machine.send({ type: 'SETTLED', attempt, ok: false, message: messageOf(reason) })
        return
      }
      Promise.resolve(result).then(
        () => machine.send({ type: 'SETTLED', attempt, ok: true }),
        (reason) => machine.send({ type: 'SETTLED', attempt, ok: false, message: messageOf(reason) })
      )
    }
    if (next.intent.nonce !== previous.intent.nonce) {
      const details = changeDetails(next.intent) as PopconfirmChangeDetails
      if (!next.intent.open && details.reason !== 'confirm') config.onCancel?.()
      config.onOpenChange?.(next.intent.open, details)
    }
  })
  return machine
}
