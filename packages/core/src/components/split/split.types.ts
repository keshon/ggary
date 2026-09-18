/**
 * `horizontal`: the panes stand side by side and the separator between them is
 * a vertical line. `vertical`: one pane over the other.
 */
export type SplitOrientation = 'horizontal' | 'vertical'

/** The pane whose size is set: the list beside a detail, the editor over a console. */
export type SplitPrimary = 'start' | 'end'

export interface SplitOptions {
  orientation: SplitOrientation
  primary: SplitPrimary
  /** In px. */
  min: number
  max: number
  /** An arrow key moves this far; Shift, four times as far. */
  step: number
  /** Enter, or a drag past half the minimum, folds the primary pane away. */
  collapsible: boolean
  /** Where a double click on the separator puts it back. */
  defaultSize: number
}

export interface SplitState extends SplitOptions {
  id: string
  /** The primary pane's size in px, whether or not it is folded away. */
  size: number
  collapsed: boolean
}

export type SplitChangeReason = 'keyboard' | 'pointer' | 'reset' | 'api'

export type SplitEvent =
  /** `limit` is what fits in the frame now: the other pane keeps its minimum. */
  | { type: 'SET_SIZE'; size: number; limit?: number; reason?: SplitChangeReason }
  | { type: 'STEP'; delta: number; limit?: number }
  | { type: 'TO_MIN' }
  | { type: 'TO_MAX'; limit?: number }
  | { type: 'COLLAPSE' }
  | { type: 'EXPAND' }
  | { type: 'TOGGLE_COLLAPSE' }
  | { type: 'RESET' }
  | { type: 'SYNC_SIZE'; size: number }
  | ({ type: 'SYNC_OPTIONS' } & Partial<SplitOptions>)
