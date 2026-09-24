import type { TypeaheadState } from '../../utils/typeahead'

export interface TreeNode {
  value: string
  label: string
  disabled?: boolean
  children?: TreeNode[]
}

/** `single`: one node is chosen. `multiple`: each press adds or takes back. `none`: a tree to open and walk, nothing chosen. */
export type TreeSelectionMode = 'single' | 'multiple' | 'none'

export interface TreeOptions {
  selectionMode: TreeSelectionMode
  disabled: boolean
}

export interface TreeState extends TreeOptions {
  id: string
  items: TreeNode[]
  /** The open branches. */
  expanded: string[]
  /** The chosen nodes. */
  value: string[]
  controlled: boolean
  expandedControlled: boolean
  /** The roving tab stop; `nonce` moves real focus there. */
  focus: { value: string | null; nonce: number }
  typeahead: TypeaheadState
  intent: { value: string[]; nonce: number }
  expandIntent: { value: string[]; nonce: number }
}

export type TreeEvent =
  | { type: 'FOCUS'; value: string }
  | { type: 'MOVE'; step: number }
  | { type: 'EDGE'; edge: 'first' | 'last' }
  /** ArrowRight: open a closed branch, or step onto an open one's first child. */
  | { type: 'INTO' }
  /** ArrowLeft: close an open branch, or step up to the parent. */
  | { type: 'OUT' }
  | { type: 'TOGGLE_EXPANDED'; value: string }
  /** `*`: open every sibling of the focused node. */
  | { type: 'EXPAND_SIBLINGS' }
  | { type: 'SELECT'; value?: string }
  | { type: 'TYPE'; char: string; now: number }
  | { type: 'SYNC_VALUE'; value: string[] }
  | { type: 'SYNC_EXPANDED'; expanded: string[] }
  | { type: 'SYNC_ITEMS'; items: TreeNode[] }
  | ({ type: 'SYNC_OPTIONS' } & Partial<TreeOptions>)

/** A visible row: the node, and where it stands. */
export interface TreeRow {
  node: TreeNode
  level: number
  posinset: number
  setsize: number
  parent: string | null
}

export interface TreeConnectOptions {
  /** The tree's accessible name. */
  label?: string
}
