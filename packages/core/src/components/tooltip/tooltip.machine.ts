import { createMachine, withEffects, type Machine } from '../../machine'
import { changeDetails, initialOpen, requestOpen, syncOpen, syncOptions } from '../../utils/open-intent'
import type { TooltipChangeDetails, TooltipChangeReason, TooltipEvent, TooltipOptions, TooltipState } from './tooltip.types'

export const DEFAULTS: TooltipOptions = { placement: 'top', openDelay: 500, closeDelay: 150, disabled: false }

/** Settle now: make the request and drop whatever was pending, keeping identity when nothing moves. */
function settle(state: TooltipState, open: boolean, reason: TooltipChangeReason): TooltipState {
  const next = requestOpen(state, open, reason)
  if (next === state && state.pending === null) return state
  return { ...next, pending: null }
}

function wait(state: TooltipState, pending: TooltipState['pending']): TooltipState {
  return state.pending === pending ? state : { ...state, pending }
}

/**
 * Hover shows it after a delay and hides it after a shorter one, so a pointer
 * crossing the page does not flash every tooltip on the way, and a pointer
 * moving from the trigger onto the tooltip does not lose it (WCAG 1.4.13:
 * hoverable). Keyboard focus shows it at once. A press on the trigger and
 * Escape hide it at once.
 *
 * The reducer only records what is pending; the timers are effects, below.
 */
export function reducer(state: TooltipState, event: TooltipEvent): TooltipState {
  switch (event.type) {
    case 'POINTER_ENTER':
      if (state.disabled) return state
      if (state.open) return wait(state, null)
      if (event.warm || state.openDelay === 0) return settle(state, true, 'pointer')
      return wait(state, 'open')

    case 'POINTER_LEAVE':
    case 'CONTENT_LEAVE':
      if (!state.open) return wait(state, null)
      if (state.closeDelay === 0) return settle(state, false, 'pointer')
      return wait(state, 'close')

    case 'CONTENT_ENTER':
      return state.pending === 'close' ? wait(state, null) : state

    case 'FOCUS':
      return state.disabled ? state : settle(state, true, 'focus')

    case 'BLUR':
      return settle(state, false, 'focus')

    case 'PRESS':
      return settle(state, false, 'press')

    case 'ESCAPE':
      return settle(state, false, 'escape')

    case 'TIMER':
      if (state.pending === 'open') return settle(state, true, 'pointer')
      if (state.pending === 'close') return settle(state, false, 'pointer')
      return state

    case 'OPEN':
      return settle(state, true, event.reason ?? 'api')

    case 'CLOSE':
      return settle(state, false, event.reason ?? 'api')

    case 'DESTROY':
      return wait(state, null)

    case 'SYNC_OPEN':
      return syncOpen(state, event.open)

    case 'SYNC_OPTIONS': {
      const { type: _type, ...options } = event
      const next = syncOptions(state, DEFAULTS, options)
      // Disabling a showing tooltip hides it.
      return next.disabled && next.open ? settle(next, false, 'api') : next
    }
  }
}

export interface TooltipMachineConfig extends Partial<TooltipOptions> {
  id: string
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: TooltipChangeDetails) => void
}

export function initialState(config: TooltipMachineConfig): TooltipState {
  return {
    id: config.id,
    ...initialOpen(config, 'api' as const),
    placement: config.placement ?? DEFAULTS.placement,
    openDelay: config.openDelay ?? DEFAULTS.openDelay,
    closeDelay: config.closeDelay ?? DEFAULTS.closeDelay,
    disabled: config.disabled ?? DEFAULTS.disabled,
    pending: null,
  }
}

/*
 * The warm window. Once a pointer leaves a showing tooltip, the next one it
 * enters within this window shows at once: moving along a toolbar should read
 * as one conversation, not a delay per button. Page-wide on purpose — it is
 * about the pointer, not about any one tooltip.
 */
const WARM_MS = 600
let warmUntil = 0

/** End the warm window now. For tests, which must not inherit one another's pointer. */
export function coolDownTooltips(): void {
  warmUntil = 0
}

export function createTooltipMachine(config: TooltipMachineConfig): Machine<TooltipState, TooltipEvent> {
  const base = createMachine(initialState(config), reducer)
  let timer: ReturnType<typeof setTimeout> | undefined

  const machine: Machine<TooltipState, TooltipEvent> = withEffects(
    {
      ...base,
      send(event) {
        const state = base.getState()
        if (event.type === 'POINTER_ENTER' && event.warm === undefined) {
          event = { ...event, warm: Date.now() < warmUntil }
        }
        if ((event.type === 'POINTER_LEAVE' || event.type === 'CONTENT_LEAVE') && state.open) {
          warmUntil = Date.now() + state.closeDelay + WARM_MS
        }
        base.send(event)
      },
    },
    (previous, next) => {
      if (next.pending !== previous.pending) {
        clearTimeout(timer)
        if (next.pending) {
          const delay = next.pending === 'open' ? next.openDelay : next.closeDelay
          timer = setTimeout(() => machine.send({ type: 'TIMER' }), delay)
        }
      }
      if (next.intent.nonce !== previous.intent.nonce) {
        config.onOpenChange?.(next.intent.open, changeDetails(next.intent) as TooltipChangeDetails)
      }
    }
  )
  return machine
}
