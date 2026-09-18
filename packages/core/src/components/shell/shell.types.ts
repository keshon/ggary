import type { OpenIntent } from '../../utils/open-intent'

/**
 * What the side column becomes on a narrow screen.
 *
 * `bar`: a horizontal strip under the header. It needs no script, so it cannot
 * fail to open, and it suits a short navigation — up to eight items or so.
 * `drawer`: a panel that slides in over the page from a button in the header.
 * It keeps the column's groups and labels, which a long navigation needs: seventy
 * items in a strip is a strip eight thousand pixels wide.
 */
export type ShellCollapse = 'bar' | 'drawer'

export type ShellChangeReason = 'toggle' | 'escape' | 'outside' | 'navigate' | 'resize' | 'api'

export interface ShellChangeDetails {
  reason: ShellChangeReason
}

export interface ShellOptions {
  collapse: ShellCollapse
}

export interface ShellState extends ShellOptions {
  id: string
  /** The drawer. Means nothing on a wide screen, where the column always stands. */
  open: boolean
  controlled: boolean
  intent: OpenIntent<ShellChangeReason>
}

export type ShellEvent =
  | { type: 'OPEN'; reason?: ShellChangeReason }
  | { type: 'CLOSE'; reason: ShellChangeReason }
  | { type: 'TOGGLE'; reason?: ShellChangeReason }
  | { type: 'SYNC_OPEN'; open: boolean }
  | ({ type: 'SYNC_OPTIONS' } & Partial<ShellOptions>)
