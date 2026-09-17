import type { OpenIntent } from '../../utils/open-intent'
import type { Placement } from '../../utils/position'

export type PopoverPlacement = Placement

export type PopoverChangeReason = 'trigger' | 'escape' | 'outside' | 'close-button' | 'api'

export interface PopoverChangeDetails {
  reason: PopoverChangeReason
}

export interface PopoverOptions {
  placement: PopoverPlacement
  closeOnEscape: boolean
  closeOnOutside: boolean
}

export interface PopoverState extends PopoverOptions {
  id: string
  open: boolean
  controlled: boolean
  intent: OpenIntent<PopoverChangeReason>
}

export type PopoverEvent =
  | { type: 'OPEN'; reason?: PopoverChangeReason }
  | { type: 'CLOSE'; reason: PopoverChangeReason }
  | { type: 'TOGGLE'; reason?: PopoverChangeReason }
  | { type: 'SYNC_OPEN'; open: boolean }
  | ({ type: 'SYNC_OPTIONS' } & Partial<PopoverOptions>)
