import type { OpenIntent } from '../../utils/open-intent'
import type { Placement } from '../../utils/position'

/** Why it opened or closed. `confirm`: the action was done; `cancel`: the safe answer was pressed. */
export type PopconfirmChangeReason = 'trigger' | 'escape' | 'outside' | 'cancel' | 'confirm' | 'api'

export interface PopconfirmChangeDetails {
  reason: PopconfirmChangeReason
}

export interface PopconfirmOptions {
  placement: Placement
}

export interface PopconfirmState extends PopconfirmOptions {
  id: string
  open: boolean
  controlled: boolean
  intent: OpenIntent<PopconfirmChangeReason>
  /** The action is under way: its button is busy and the question stays. */
  pending: boolean
  /** Why the last attempt failed, until the next attempt or the next opening. Empty: failed without a message. */
  error: string | null
  /** Counts attempts, so the answer to one that was abandoned is not taken for the next. */
  attempt: number
}

export type PopconfirmEvent =
  | { type: 'OPEN'; reason?: PopconfirmChangeReason }
  | { type: 'CLOSE'; reason: PopconfirmChangeReason }
  | { type: 'TOGGLE'; reason?: PopconfirmChangeReason }
  | { type: 'CONFIRM' }
  | { type: 'SETTLED'; attempt: number; ok: boolean; message?: string }
  | ({ type: 'SYNC_OPTIONS' } & Partial<PopconfirmOptions>)

export interface PopconfirmWords {
  /** The safe answer. Default "Cancel". */
  cancel?: string
  /** The action's answer. Default "Confirm"; name the action instead: "Delete". */
  confirm?: string
  /** Said when the action failed without a message of its own. */
  failed?: string
}
