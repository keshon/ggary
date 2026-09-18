import type { IconName } from '@ggary/icons'
import { createMachine, withEffects, type Machine } from '../../machine'
import { createAnatomy, type Dict, type Normalizer } from '../../types'
import { syncOptions } from '../../utils/open-intent'
import { typeahead, type TypeaheadState } from '../../utils/typeahead'

/**
 * Tree view (WAI-ARIA APG): nested items one under another, a branch opened in
 * place. Drawn flat — one row per visible node, its depth, its place among its
 * siblings and their count said with `aria-level`, `aria-posinset` and
 * `aria-setsize` — so a framework renders a list, and a long tree could be
 * windowed like the grid's rows.
 */

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

export const treeAnatomy = createAnatomy('tree', ['root', 'item', 'toggle', 'item-text', 'item-indicator'] as const)
export type TreePart = (typeof treeAnatomy.parts)[number]

const DEFAULTS: TreeOptions = { selectionMode: 'single', disabled: false }

export const hasChildren = (node: TreeNode) => (node.children?.length ?? 0) > 0

/** A visible row: the node, and where it stands. */
export interface TreeRow {
  node: TreeNode
  level: number
  posinset: number
  setsize: number
  parent: string | null
}

/** The rows a reader sees: every node whose ancestors are all open, in order. */
export function visibleRows(items: TreeNode[], expanded: readonly string[]): TreeRow[] {
  const open = new Set(expanded)
  const rows: TreeRow[] = []
  const walk = (nodes: TreeNode[], level: number, parent: string | null) => {
    nodes.forEach((node, i) => {
      rows.push({ node, level, posinset: i + 1, setsize: nodes.length, parent })
      if (hasChildren(node) && open.has(node.value)) walk(node.children!, level + 1, node.value)
    })
  }
  walk(items, 1, null)
  return rows
}

/** The path of values from the root down to `value`, or null when it is not in the tree. */
export function pathTo(items: TreeNode[], value: string): string[] | null {
  for (const node of items) {
    if (node.value === value) return [value]
    const below = node.children ? pathTo(node.children, value) : null
    if (below) return [node.value, ...below]
  }
  return null
}

const isDisabled = (state: TreeState, node: TreeNode | undefined) => !node || state.disabled || !!node.disabled

function commit(state: TreeState, value: string[]): TreeState {
  const next = { ...state, intent: { value, nonce: state.intent.nonce + 1 } }
  return state.controlled ? next : { ...next, value }
}

function setExpanded(state: TreeState, expanded: string[]): TreeState {
  const next = { ...state, expandIntent: { value: expanded, nonce: state.expandIntent.nonce + 1 } }
  if (state.expandedControlled) return next
  // The focused node went under a closing branch: the focus climbs to the branch.
  const rows = visibleRows(state.items, expanded)
  const focused = state.focus.value
  if (focused === null || rows.some((row) => row.node.value === focused)) return { ...next, expanded }
  const path = pathTo(state.items, focused) ?? []
  const landing = [...path].reverse().find((value) => rows.some((row) => row.node.value === value)) ?? null
  return { ...next, expanded, focus: { value: landing, nonce: state.focus.nonce + 1 } }
}

const moveTo = (state: TreeState, value: string | undefined): TreeState =>
  value === undefined || value === state.focus.value ? state : { ...state, focus: { value, nonce: state.focus.nonce + 1 } }

/** The row the focus is on, or the tab stop's when it has not arrived yet. */
function current(state: TreeState, rows: TreeRow[]): number {
  const stop = tabStop(state, rows)
  return rows.findIndex((row) => row.node.value === stop)
}

/** The tab stop: the focused node, the first chosen one in view, or the first row that can be reached. */
export function tabStop(state: TreeState, rows = visibleRows(state.items, state.expanded)): string | null {
  const visible = (value: string | null) => value !== null && rows.some((row) => row.node.value === value)
  if (visible(state.focus.value)) return state.focus.value
  const chosen = state.value.find((value) => visible(value))
  if (chosen !== undefined) return chosen
  return rows.find((row) => !isDisabled(state, row.node))?.node.value ?? rows[0]?.node.value ?? null
}

export function reducer(state: TreeState, event: TreeEvent): TreeState {
  const rows = () => visibleRows(state.items, state.expanded)
  switch (event.type) {
    case 'FOCUS':
      return event.value === state.focus.value ? state : { ...state, focus: { value: event.value, nonce: state.focus.nonce } }

    case 'MOVE': {
      const list = rows()
      // A disabled node is passed over, as the cascader's is.
      for (let i = current(state, list) + event.step; i >= 0 && i < list.length; i += Math.sign(event.step)) {
        if (!isDisabled(state, list[i].node)) return moveTo(state, list[i].node.value)
      }
      return state
    }

    case 'EDGE': {
      const list = rows()
      const ordered = event.edge === 'first' ? list : [...list].reverse()
      return moveTo(state, ordered.find((row) => !isDisabled(state, row.node))?.node.value)
    }

    case 'INTO': {
      const list = rows()
      const row = list[current(state, list)]
      if (!row || !hasChildren(row.node)) return state
      if (!state.expanded.includes(row.node.value)) return isDisabled(state, row.node) ? state : setExpanded(state, [...state.expanded, row.node.value])
      return moveTo(state, row.node.children!.find((child) => !isDisabled(state, child))?.value)
    }

    case 'OUT': {
      const list = rows()
      const row = list[current(state, list)]
      if (!row) return state
      if (hasChildren(row.node) && state.expanded.includes(row.node.value)) return setExpanded(state, state.expanded.filter((value) => value !== row.node.value))
      return row.parent === null ? state : moveTo(state, row.parent)
    }

    case 'TOGGLE_EXPANDED': {
      const path = pathTo(state.items, event.value)
      const node = path && nodeAt(state.items, path)
      if (!node || !hasChildren(node) || isDisabled(state, node)) return state
      const open = state.expanded.includes(event.value)
      return setExpanded(state, open ? state.expanded.filter((value) => value !== event.value) : [...state.expanded, event.value])
    }

    case 'EXPAND_SIBLINGS': {
      const list = rows()
      const row = list[current(state, list)]
      if (!row) return state
      const siblings = row.parent === null ? state.items : nodeAt(state.items, pathTo(state.items, row.parent)!)!.children!
      const closed = siblings.filter((node) => hasChildren(node) && !isDisabled(state, node) && !state.expanded.includes(node.value)).map((node) => node.value)
      return closed.length === 0 ? state : setExpanded(state, [...state.expanded, ...closed])
    }

    case 'SELECT': {
      const value = event.value ?? tabStop(state)
      if (value === null) return state
      const path = pathTo(state.items, value)
      const node = path && nodeAt(state.items, path)
      if (!node || isDisabled(state, node)) return state
      // A press has already put the focus on the row: the tab stop follows it, and nothing moves.
      const moved = { ...state, focus: { value, nonce: state.focus.nonce } }
      if (state.selectionMode === 'multiple') {
        // Each press adds or takes back: opening the branch as well would fight the choice. The chevron opens it.
        return commit(moved, state.value.includes(value) ? state.value.filter((v) => v !== value) : [...state.value, value])
      }
      // A press anywhere on a branch's row opens or closes it, as a file tree's does; single choice chooses it too.
      const chosen = state.selectionMode === 'none' || (state.value.length === 1 && state.value[0] === value) ? moved : commit(moved, [value])
      return hasChildren(node) ? reducer(chosen, { type: 'TOGGLE_EXPANDED', value }) : chosen
    }

    case 'TYPE': {
      const list = rows()
      const from = current(state, list)
      const result = typeahead(list, { char: event.char, now: event.now, state: state.typeahead, from, getText: (row) => row.node.label, isDisabled: (row) => isDisabled(state, row.node) })
      const next = { ...state, typeahead: result.state }
      return result.index === -1 ? next : moveTo(next, list[result.index].node.value)
    }

    case 'SYNC_VALUE':
      return sameList(event.value, state.value) ? state : { ...state, value: event.value }
    case 'SYNC_EXPANDED':
      return sameList(event.expanded, state.expanded) ? state : { ...state, expanded: event.expanded }
    case 'SYNC_ITEMS':
      return event.items === state.items ? state : { ...state, items: event.items }
    case 'SYNC_OPTIONS': {
      const { type: _type, ...options } = event
      return syncOptions(state, DEFAULTS, options)
    }
  }
}

const sameList = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((value, i) => value === b[i])

function nodeAt(items: TreeNode[], path: string[]): TreeNode | undefined {
  let nodes: TreeNode[] | undefined = items
  let node: TreeNode | undefined
  for (const value of path) {
    node = nodes?.find((candidate) => candidate.value === value)
    nodes = node?.children
  }
  return node
}

export interface TreeMachineConfig extends Partial<TreeOptions> {
  id: string
  items?: TreeNode[]
  /** Controlled: the chosen nodes. Omit and use `defaultValue` for uncontrolled. */
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  /** Controlled: the open branches. Omit and use `defaultExpanded` for uncontrolled. */
  expanded?: string[]
  defaultExpanded?: string[]
  onExpandedChange?: (expanded: string[]) => void
}

export function initialState(config: TreeMachineConfig): TreeState {
  const controlled = config.value !== undefined
  const expandedControlled = config.expanded !== undefined
  const value = (controlled ? config.value : config.defaultValue) ?? []
  const expanded = (expandedControlled ? config.expanded : config.defaultExpanded) ?? []
  return {
    id: config.id,
    items: config.items ?? [],
    value,
    expanded,
    controlled,
    expandedControlled,
    selectionMode: config.selectionMode ?? DEFAULTS.selectionMode,
    disabled: config.disabled ?? DEFAULTS.disabled,
    focus: { value: null, nonce: 0 },
    typeahead: { buffer: '', at: 0 },
    intent: { value, nonce: 0 },
    expandIntent: { value: expanded, nonce: 0 },
  }
}

export function createTreeMachine(config: TreeMachineConfig): Machine<TreeState, TreeEvent> {
  const machine = createMachine(initialState(config), reducer)
  return withEffects(machine, (previous, next) => {
    if (next.expandIntent.nonce !== previous.expandIntent.nonce) config.onExpandedChange?.(next.expandIntent.value)
    if (next.intent.nonce !== previous.intent.nonce) config.onValueChange?.(next.intent.value)
  })
}

const idPart = (value: string) => value.replace(/[^\w-]/g, (char) => `_${char.charCodeAt(0).toString(16)}`)

export const treeIds = (id: string) => ({
  root: id,
  item: (value: string) => `${id}-item-${idPart(value)}`,
})

export interface TreeConnectOptions {
  /** The tree's accessible name. */
  label?: string
}

export function connect<T = Dict>(state: TreeState, send: (event: TreeEvent) => void, normalize: Normalizer<T>, options: TreeConnectOptions = {}) {
  const ids = treeIds(state.id)
  const rows = visibleRows(state.items, state.expanded)
  const stop = tabStop(state, rows)
  const rtl = (event: KeyboardEvent) => (event.currentTarget as Element | null)?.closest?.('[dir]')?.getAttribute('dir') === 'rtl'

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return
    const into = rtl(event) ? 'ArrowLeft' : 'ArrowRight'
    const out = rtl(event) ? 'ArrowRight' : 'ArrowLeft'
    const handled = (sent: TreeEvent) => {
      event.preventDefault()
      send(sent)
    }
    switch (event.key) {
      case 'ArrowDown':
        return handled({ type: 'MOVE', step: 1 })
      case 'ArrowUp':
        return handled({ type: 'MOVE', step: -1 })
      case 'Home':
        return handled({ type: 'EDGE', edge: 'first' })
      case 'End':
        return handled({ type: 'EDGE', edge: 'last' })
      case into:
        return handled({ type: 'INTO' })
      case out:
        return handled({ type: 'OUT' })
      case 'Enter':
      case ' ':
        return handled({ type: 'SELECT' })
      case '*':
        return handled({ type: 'EXPAND_SIBLINGS' })
    }
    if (event.key.length === 1 && event.key !== ' ') send({ type: 'TYPE', char: event.key, now: Date.now() })
  }

  return {
    ids,
    rows,
    value: state.value,
    expanded: state.expanded,
    focusNonce: state.focus.nonce,
    focusValue: state.focus.value,
    hasChildren,
    toggle: (value: string) => send({ type: 'TOGGLE_EXPANDED', value }),
    select: (value: string) => send({ type: 'SELECT', value }),

    rootProps: normalize({
      ...treeAnatomy.attrs('root'),
      id: ids.root,
      role: 'tree',
      'aria-label': options.label,
      'aria-multiselectable': state.selectionMode === 'multiple' ? 'true' : undefined,
      'data-disabled': state.disabled ? '' : undefined,
      onKeyDown,
    }),

    getItemProps: (row: TreeRow) => {
      const { node } = row
      const branch = hasChildren(node)
      const open = branch && state.expanded.includes(node.value)
      const chosen = state.value.includes(node.value)
      const disabled = isDisabled(state, node)
      return normalize({
        ...treeAnatomy.attrs('item'),
        id: ids.item(node.value),
        role: 'treeitem',
        'aria-level': row.level,
        'aria-posinset': row.posinset,
        'aria-setsize': row.setsize,
        'aria-expanded': branch ? (open ? 'true' : 'false') : undefined,
        // Single choice says only the chosen one; a multiple one says every node, chosen or not (APG).
        'aria-selected': state.selectionMode === 'none' ? undefined : state.selectionMode === 'multiple' ? (chosen ? 'true' : 'false') : chosen ? 'true' : undefined,
        'aria-disabled': disabled ? 'true' : undefined,
        tabIndex: node.value === stop ? 0 : -1,
        // The depth, for the indent: data, not a look (the slider's fill is the same kind of thing).
        style: { '--gg-tree-level': row.level },
        'data-value': node.value,
        'data-branch': branch ? '' : undefined,
        'data-state': branch ? (open ? 'open' : 'closed') : undefined,
        'data-chosen': chosen ? '' : undefined,
        'data-disabled': disabled ? '' : undefined,
        onClick: () => send({ type: 'SELECT', value: node.value }),
        onFocusIn: (event: FocusEvent) => {
          if (event.target === event.currentTarget) send({ type: 'FOCUS', value: node.value })
        },
      })
    },

    /** The chevron: a press target of its own, so a branch opens without being chosen — and on a touch screen. */
    getToggleProps: (row: TreeRow) => {
      const open = state.expanded.includes(row.node.value)
      return normalize({
        ...treeAnatomy.attrs('toggle'),
        'aria-hidden': 'true',
        'data-icon': 'chevron-right' satisfies IconName,
        'data-state': hasChildren(row.node) ? (open ? 'open' : 'closed') : undefined,
        'data-leaf': hasChildren(row.node) ? undefined : '',
        onClick: (event: MouseEvent) => {
          if (!hasChildren(row.node)) return
          event.stopPropagation()
          send({ type: 'TOGGLE_EXPANDED', value: row.node.value })
          // The press lands on the row it belongs to, so the tab stop comes along.
          send({ type: 'FOCUS', value: row.node.value })
        },
      })
    },

    itemTextProps: normalize({ ...treeAnatomy.attrs('item-text') }),
    itemIndicatorProps: normalize({ ...treeAnatomy.attrs('item-indicator'), 'aria-hidden': 'true', 'data-icon': 'check' satisfies IconName }),
  }
}

export type TreeApi<T = Dict> = ReturnType<typeof connect<T>>
