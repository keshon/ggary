import type { OpenIntent } from '../../utils/open-intent'
import type { Placement } from '../../utils/position'

export type TooltipPlacement = Placement

export type TooltipChangeReason = 'pointer' | 'focus' | 'escape' | 'press' | 'api'

export interface TooltipChangeDetails {
  reason: TooltipChangeReason
}

export interface TooltipOptions {
  placement: TooltipPlacement
  /** Milliseconds a pointer rests on the trigger before the tooltip shows. */
  openDelay: number
  /** Milliseconds before it hides after the pointer leaves — room to reach the tooltip itself. */
  closeDelay: number
  disabled: boolean
}

export interface TooltipState extends TooltipOptions {
  id: string
  open: boolean
  controlled: boolean
  intent: OpenIntent<TooltipChangeReason>
  /** A delayed open or close is waiting on its timer. */
  pending: 'open' | 'close' | null
}

export type TooltipEvent =
  /** `warm`: another tooltip was just showing, so this one skips its delay. */
  | { type: 'POINTER_ENTER'; warm?: boolean }
  | { type: 'POINTER_LEAVE' }
  | { type: 'CONTENT_ENTER' }
  | { type: 'CONTENT_LEAVE' }
  | { type: 'FOCUS' }
  | { type: 'BLUR' }
  | { type: 'PRESS' }
  | { type: 'ESCAPE' }
  /** The pending timer fired. */
  | { type: 'TIMER' }
  | { type: 'OPEN'; reason?: TooltipChangeReason }
  | { type: 'CLOSE'; reason?: TooltipChangeReason }
  /** The component is going away: drop what is pending, silently, so no timer reports later. */
  | { type: 'DESTROY' }
  | { type: 'SYNC_OPEN'; open: boolean }
  | ({ type: 'SYNC_OPTIONS' } & Partial<TooltipOptions>)
