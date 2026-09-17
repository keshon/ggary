/**
 * Open and close requests, shared by every overlay machine — Dialog, Popover,
 * Tooltip — so the three cannot drift on the one rule they all need.
 *
 * A request goes through intent: the owner hears it, and in controlled mode
 * `open` moves only when the owner answers with a sync. A request is judged
 * against `open`, not against the last request: a controlled owner may refuse
 * by not changing its prop, no answer arrives, and the next request must still
 * be heard. The cost is that a slow owner can be told twice.
 */
export interface OpenIntent<Reason extends string> {
  open: boolean
  reason: Reason
  /** Only Dialog sets it: the value of the button that submitted a <form method="dialog">. */
  returnValue?: string
  nonce: number
}

export interface OpenState<Reason extends string> {
  open: boolean
  controlled: boolean
  intent: OpenIntent<Reason>
}

export function requestOpen<Reason extends string, S extends OpenState<Reason>>(
  state: S,
  open: boolean,
  reason: Reason,
  returnValue?: string
): S {
  if (state.open === open) return state
  const next = { ...state, intent: { open, reason, returnValue, nonce: state.intent.nonce + 1 } }
  return state.controlled ? next : { ...next, open }
}

/** The owner's state. Not a request: nobody is told. */
export function syncOpen<S extends OpenState<string>>(state: S, open: boolean): S {
  return state.open === open ? state : { ...state, open }
}

export function initialOpen<Reason extends string>(config: { open?: boolean; defaultOpen?: boolean }, reason: Reason) {
  const controlled = config.open !== undefined
  const open = controlled ? Boolean(config.open) : Boolean(config.defaultOpen)
  return { open, controlled, intent: { open, reason, nonce: 0 } as OpenIntent<Reason> }
}

/**
 * Sync a set of options onto state, reading an absent option as its default
 * (as ChipGroup's SYNC_OPTIONS does). Returns the same state when nothing moved.
 */
export function syncOptions<S extends object, O extends object>(state: S, defaults: O, options: Partial<O>): S {
  let next: S | null = null
  for (const key of Object.keys(defaults) as (keyof O)[]) {
    const value = options[key] ?? defaults[key]
    if ((state as unknown as O)[key] !== value) {
      next ??= { ...state }
      ;(next as unknown as O)[key] = value
    }
  }
  return next ?? state
}

/** onOpenChange's second argument, without an absent returnValue key. */
export function changeDetails<Reason extends string>(intent: OpenIntent<Reason>) {
  const { reason, returnValue } = intent
  return returnValue === undefined ? { reason } : { reason, returnValue }
}
