import { createMachine, withEffects, type Machine } from '../../machine'
import { edgeEnabled, nextEnabled } from '../../utils/collection'
import { typeahead } from '../../utils/typeahead'
import type { CascaderEvent, CascaderNode, CascaderState } from './cascader.types'

const collection = { isDisabled: (node: CascaderNode) => Boolean(node.disabled), loop: false }
export const hasChildren = (node: CascaderNode | undefined) => Boolean(node?.children && node.children.length > 0)

/** The nodes along a path of values, as far as the path is real. */
export function nodesOf(items: readonly CascaderNode[], path: readonly string[]): CascaderNode[] {
  const nodes: CascaderNode[] = []
  let level: readonly CascaderNode[] | undefined = items
  for (const value of path) {
    const node: CascaderNode | undefined = level?.find((candidate) => candidate.value === value)
    if (!node) break
    nodes.push(node)
    level = node.children
  }
  return nodes
}

/** The columns a highlighted path opens: the roots, then each highlighted parent's children. */
export function columnsOf(items: CascaderNode[], active: readonly string[]): CascaderNode[][] {
  const columns: CascaderNode[][] = [items]
  for (const node of nodesOf(items, active)) {
    if (!hasChildren(node)) break
    columns.push(node.children!)
  }
  return columns
}

/** A path to the first leaf that can be chosen under a node: where "open" lands with nothing chosen. */
const firstPath = (items: CascaderNode[]): string[] => {
  const index = edgeEnabled(items, 'first', collection)
  return index === -1 ? [] : [items[index].value]
}

function commit(state: CascaderState, value: string[]): CascaderState {
  const next = { ...state, open: false, intent: { value, nonce: state.intent.nonce + 1 } }
  return state.controlled ? next : { ...next, value }
}

/** Move the highlight within the focused column; the columns right of it close. */
function highlightAt(state: CascaderState, level: number, value: string): CascaderState {
  const active = [...state.active.slice(0, level), value]
  return { ...state, active, focusLevel: level }
}

export function reducer(state: CascaderState, event: CascaderEvent): CascaderState {
  switch (event.type) {
    case 'OPEN': {
      if (state.open || state.disabled) return state
      // On the chosen path, its last column focused; or on the first item.
      const chosen = nodesOf(state.items, state.value).map((node) => node.value)
      const active = chosen.length > 0 ? chosen : firstPath(state.items)
      return { ...state, open: true, active, focusLevel: Math.max(0, active.length - 1), typeahead: { buffer: '', at: 0 } }
    }
    case 'CLOSE':
      return state.open ? { ...state, open: false } : state
    case 'TOGGLE':
      return reducer(state, { type: state.open ? 'CLOSE' : 'OPEN' })
    case 'MOVE':
    case 'EDGE': {
      if (!state.open) return reducer(state, { type: 'OPEN' })
      const column = columnsOf(state.items, state.active)[state.focusLevel] ?? []
      const from = column.findIndex((node) => node.value === state.active[state.focusLevel])
      const index = event.type === 'MOVE' ? nextEnabled(column, from, event.step, collection) : edgeEnabled(column, event.edge, collection)
      if (index === -1 || index === from) return state
      return highlightAt(state, state.focusLevel, column[index].value)
    }
    case 'INTO': {
      const node = nodesOf(state.items, state.active)[state.focusLevel]
      if (!state.open || !hasChildren(node)) return state
      // Into the children: onto the chosen one when the choice runs through here.
      const onPath = nodesOf(state.items, state.value).map((entry) => entry.value)
      const chosenChild = onPath.slice(0, state.focusLevel + 1).every((value, i) => value === state.active[i]) ? onPath[state.focusLevel + 1] : undefined
      const children = node!.children!
      const target = chosenChild && children.some((child) => child.value === chosenChild && !child.disabled) ? chosenChild : firstPath(children)[0]
      if (target === undefined) return state
      return highlightAt(state, state.focusLevel + 1, target)
    }
    case 'OUT':
      if (!state.open || state.focusLevel === 0) return state
      return { ...state, focusLevel: state.focusLevel - 1, active: state.active.slice(0, state.focusLevel) }
    case 'HIGHLIGHT': {
      const column = columnsOf(state.items, state.active)[event.level]
      const node = column?.find((candidate) => candidate.value === event.value)
      if (!node || node.disabled) return state
      if (state.active[event.level] === event.value && state.focusLevel === event.level) return state
      return highlightAt(state, event.level, event.value)
    }
    case 'SELECT': {
      const level = event.level ?? state.focusLevel
      const base = event.value !== undefined ? reducer(state, { type: 'HIGHLIGHT', level, value: event.value }) : state
      const node = nodesOf(base.items, base.active)[level]
      if (!node || node.disabled) return base
      // A branch opens its column unless branches may be chosen themselves.
      if (hasChildren(node) && !base.selectParents) return reducer({ ...base, focusLevel: level }, { type: 'INTO' })
      return commit(base, base.active.slice(0, level + 1))
    }
    case 'TYPE': {
      if (!state.open) return state
      const column = columnsOf(state.items, state.active)[state.focusLevel] ?? []
      const from = column.findIndex((node) => node.value === state.active[state.focusLevel])
      const result = typeahead(column, { char: event.char, now: event.now, state: state.typeahead, from, getText: (node) => node.label, isDisabled: (node) => Boolean(node.disabled) })
      const next = { ...state, typeahead: result.state }
      return result.index === -1 ? next : highlightAt(next, state.focusLevel, column[result.index].value)
    }
    case 'CLEAR':
      return state.value.length === 0 ? state : { ...commit(state, []), open: state.open }
    case 'SYNC_VALUE':
      return event.value.length === state.value.length && event.value.every((value, i) => value === state.value[i]) ? state : { ...state, value: event.value }
    case 'SYNC_ITEMS':
      return event.items === state.items ? state : { ...state, items: event.items, active: nodesOf(event.items, state.active).map((node) => node.value) }
    case 'SYNC_OPTIONS': {
      const selectParents = event.selectParents ?? state.selectParents
      const disabled = event.disabled ?? state.disabled
      if (selectParents === state.selectParents && disabled === state.disabled) return state
      return { ...state, selectParents, disabled, open: disabled ? false : state.open }
    }
  }
}

export interface CascaderConfig {
  id: string
  items: CascaderNode[]
  /** Controlled: the chosen path, root first. Omit and use `defaultValue` for uncontrolled. */
  value?: string[] | null
  defaultValue?: string[] | null
  /** A branch may be chosen itself: "all of Tatarstan". Default false: leaves only. */
  selectParents?: boolean
  disabled?: boolean
  onValueChange?: (value: string[], nodes: CascaderNode[]) => void
  onOpenChange?: (open: boolean) => void
}

export function initialState(config: CascaderConfig): CascaderState {
  const controlled = config.value !== undefined
  const value = (controlled ? config.value : config.defaultValue) ?? []
  return {
    id: config.id,
    items: config.items,
    open: false,
    value,
    active: [],
    focusLevel: 0,
    selectParents: config.selectParents ?? false,
    disabled: config.disabled ?? false,
    controlled,
    typeahead: { buffer: '', at: 0 },
    intent: { value, nonce: 0 },
  }
}

export function createCascaderMachine(config: CascaderConfig): Machine<CascaderState, CascaderEvent> {
  const machine = createMachine(initialState(config), reducer)
  return withEffects(machine, (previous, next) => {
    if (previous.open !== next.open) config.onOpenChange?.(next.open)
    if (previous.intent.nonce !== next.intent.nonce) config.onValueChange?.(next.intent.value, nodesOf(next.items, next.intent.value))
  })
}
