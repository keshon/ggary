export interface SelectItem {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectState {
  id: string
  items: SelectItem[]
  open: boolean
  value: string | null
  highlightedIndex: number
  disabled: boolean
  /** Controlled mode: the machine reports intent but never owns `value`. */
  controlled: boolean
  typeahead: { buffer: string; at: number }
  /**
   * The last value the USER asked for, with a counter so repeats are still
   * observable. This is what `onValueChange` fires on.
   *
   * It has to be separate from `value`, because the two differ in both
   * directions: in controlled mode `value` never moves on its own, and
   * SYNC_VALUE moves `value` without the user having asked for anything. Diffing
   * `value` alone gets you a dead controlled component and an echo loop.
   */
  intent: { value: string | null; nonce: number }
}

export type SelectEvent =
  | { type: 'OPEN'; focus?: 'first' | 'last' | 'selected' }
  | { type: 'CLOSE' }
  | { type: 'TOGGLE' }
  | { type: 'HIGHLIGHT'; index: number }
  | { type: 'HIGHLIGHT_MOVE'; step: number }
  | { type: 'HIGHLIGHT_EDGE'; edge: 'first' | 'last' }
  | { type: 'SELECT'; index?: number }
  | { type: 'CLEAR' }
  | { type: 'TYPE'; char: string; now: number }
  | { type: 'SYNC_VALUE'; value: string | null }
  | { type: 'SYNC_ITEMS'; items: SelectItem[] }
  | { type: 'SYNC_DISABLED'; disabled: boolean }
