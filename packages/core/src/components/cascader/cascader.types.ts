import type { TypeaheadState } from '../../utils/typeahead'

export interface CascaderNode {
  value: string
  label: string
  disabled?: boolean
  children?: CascaderNode[]
}

export interface CascaderState {
  id: string
  items: CascaderNode[]
  open: boolean
  /** The chosen path, root first. */
  value: string[]
  /** The highlighted path: one item per open column, root first. */
  active: string[]
  /** The column the keyboard is in. */
  focusLevel: number
  selectParents: boolean
  disabled: boolean
  controlled: boolean
  typeahead: TypeaheadState
  intent: { value: string[]; nonce: number }
}

export type CascaderEvent =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'TOGGLE' }
  | { type: 'MOVE'; step: number }
  | { type: 'EDGE'; edge: 'first' | 'last' }
  | { type: 'INTO' }
  | { type: 'OUT' }
  | { type: 'HIGHLIGHT'; level: number; value: string }
  | { type: 'SELECT'; level?: number; value?: string }
  | { type: 'TYPE'; char: string; now: number }
  | { type: 'CLEAR' }
  | { type: 'SYNC_VALUE'; value: string[] }
  | { type: 'SYNC_ITEMS'; items: CascaderNode[] }
  | { type: 'SYNC_OPTIONS'; selectParents?: boolean; disabled?: boolean }

export interface CascaderConnectOptions {
  label?: string
  placeholder?: string
  /** The name of the first column; the others are named by their parent. */
  rootLabel?: string
  /** Submits the chosen leaf's value. */
  name?: string
  form?: string
}
