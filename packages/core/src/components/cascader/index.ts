import type { IconName } from '@ggary/icons'
import { createMachine, withEffects, type Machine } from '../../machine'
import { createAnatomy, type Dict, type Normalizer } from '../../types'
import { edgeEnabled, nextEnabled } from '../../utils/collection'
import { typeahead, type TypeaheadState } from '../../utils/typeahead'

/**
 * A choice from a tree, one level to a column: country, then region, then
 * city. What a Select cannot hold — three hundred cities in one list — and a
 * tree view would make tall.
 *
 * There is no ARIA pattern for it, so it is built from two that exist, as
 * Instrument's is: a button that opens a dialog, and in the dialog one listbox
 * per level. Each column is one tab stop and moves with the arrows; the column
 * to its right follows the highlighted item, the way a file browser's does.
 * Right goes into an item's children and Left back to its parent; Enter chooses
 * a leaf (or any item, with `selectParents`); Escape closes and gives the focus
 * back to the button. Each column is named by its parent — "Russia" — so a
 * screen reader says where the focus has gone.
 */

export interface CascaderNode {
  value: string
  label: string
  disabled?: boolean
  children?: CascaderNode[]
}

export const cascaderAnatomy = createAnatomy('cascader', [
  'root',
  'label',
  'trigger',
  'value',
  'separator',
  'indicator',
  'positioner',
  'content',
  'column',
  'item',
  'item-text',
  'item-branch',
  'item-indicator',
] as const)
export type CascaderPart = (typeof cascaderAnatomy.parts)[number]

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

const collection = { isDisabled: (node: CascaderNode) => Boolean(node.disabled), loop: false }
const hasChildren = (node: CascaderNode | undefined) => Boolean(node?.children && node.children.length > 0)

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

export const cascaderIds = (id: string) => ({
  root: id,
  label: `${id}-label`,
  trigger: `${id}-trigger`,
  value: `${id}-value`,
  content: `${id}-content`,
  column: (level: number) => `${id}-column-${level}`,
  item: (level: number, value: string) => `${id}-item-${level}-${value.replace(/[^\w-]/g, '_')}`,
})

export interface CascaderConnectOptions {
  label?: string
  placeholder?: string
  /** The name of the first column; the others are named by their parent. */
  rootLabel?: string
  /** Submits the chosen leaf's value. */
  name?: string
  form?: string
}

export function connect<T = Dict>(state: CascaderState, send: (event: CascaderEvent) => void, normalize: Normalizer<T>, options: CascaderConnectOptions = {}) {
  const ids = cascaderIds(state.id)
  const anatomy = cascaderAnatomy
  const chosen = nodesOf(state.items, state.value)
  const highlighted = nodesOf(state.items, state.active)
  const columns = state.open ? columnsOf(state.items, state.active) : []
  const focused = state.active[state.focusLevel]

  const onKeyDown = (event: KeyboardEvent) => {
    const rtl = typeof Element !== 'undefined' && event.currentTarget instanceof Element && getComputedStyle(event.currentTarget).direction === 'rtl'
    const into = rtl ? 'ArrowLeft' : 'ArrowRight'
    const out = rtl ? 'ArrowRight' : 'ArrowLeft'
    switch (event.key) {
      case 'ArrowDown':
        send({ type: 'MOVE', step: 1 })
        break
      case 'ArrowUp':
        send({ type: 'MOVE', step: -1 })
        break
      case 'Home':
        send({ type: 'EDGE', edge: 'first' })
        break
      case 'End':
        send({ type: 'EDGE', edge: 'last' })
        break
      case into:
        send({ type: 'INTO' })
        break
      case out:
        send({ type: 'OUT' })
        break
      case 'Enter':
      case ' ':
        send({ type: 'SELECT' })
        break
      default:
        if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return
        send({ type: 'TYPE', char: event.key, now: Date.now() })
    }
    event.preventDefault()
  }

  return {
    ids,
    open: state.open,
    value: state.value,
    chosen,
    columns,
    /** The id of the option the focus should be on, while the dialog is open. */
    focusedId: state.open && focused !== undefined ? ids.item(state.focusLevel, focused) : null,
    placeholder: options.placeholder ?? 'Choose…',
    rootProps: normalize({ ...anatomy.attrs('root'), id: ids.root, 'data-state': state.open ? 'open' : 'closed', 'data-disabled': state.disabled ? '' : undefined }),
    labelProps: normalize({ ...anatomy.attrs('label'), id: ids.label, htmlFor: ids.trigger }),
    triggerProps: normalize({
      ...anatomy.attrs('trigger'),
      id: ids.trigger,
      type: 'button',
      'aria-haspopup': 'dialog',
      'aria-expanded': state.open ? 'true' : 'false',
      'aria-controls': ids.content,
      // The label and the chosen path both: a label alone would hide the value from a screen reader.
      'aria-labelledby': options.label ? `${ids.label} ${ids.value}` : undefined,
      disabled: state.disabled || undefined,
      'data-state': state.open ? 'open' : 'closed',
      'data-placeholder': chosen.length === 0 ? '' : undefined,
      onClick: () => send({ type: 'TOGGLE' }),
      onKeyDown: (event: KeyboardEvent) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault()
          send({ type: 'OPEN' })
        }
      },
    }),
    valueProps: normalize({ ...anatomy.attrs('value'), id: ids.value }),
    separatorProps: normalize({ ...anatomy.attrs('separator'), 'aria-hidden': 'true', 'data-icon': 'chevron-right' satisfies IconName }),
    indicatorProps: normalize({ ...anatomy.attrs('indicator'), 'aria-hidden': 'true', 'data-icon': 'chevron-down' satisfies IconName, 'data-state': state.open ? 'open' : 'closed' }),
    positionerProps: normalize({ ...anatomy.attrs('positioner'), popover: 'manual', 'data-state': state.open ? 'open' : 'closed' }),
    contentProps: normalize({
      ...anatomy.attrs('content'),
      id: ids.content,
      role: 'dialog',
      'aria-modal': 'false',
      'aria-label': options.label,
      'data-state': state.open ? 'open' : 'closed',
      onKeyDown,
    }),
    getColumnProps: (level: number) =>
      normalize({
        ...anatomy.attrs('column'),
        id: ids.column(level),
        role: 'listbox',
        'aria-label': level === 0 ? (options.rootLabel ?? options.label) : highlighted[level - 1]?.label,
        'data-level': level,
      }),
    getItemProps: (node: CascaderNode, level: number) => {
      const isActive = state.active[level] === node.value
      const isChosen = chosen[level]?.value === node.value
      return normalize({
        ...anatomy.attrs('item'),
        id: ids.item(level, node.value),
        role: 'option',
        // One tab stop per column: its highlighted item.
        tabIndex: isActive ? 0 : -1,
        'aria-selected': isChosen ? 'true' : 'false',
        'aria-disabled': node.disabled ? 'true' : undefined,
        'data-value': node.value,
        'data-highlighted': isActive ? '' : undefined,
        'data-chosen': isChosen ? '' : undefined,
        'data-branch': hasChildren(node) ? '' : undefined,
        'data-disabled': node.disabled ? '' : undefined,
        onClick: () => send({ type: 'SELECT', level, value: node.value }),
        onPointerMove: () => {
          if (!node.disabled && !(isActive && state.focusLevel === level)) send({ type: 'HIGHLIGHT', level, value: node.value })
        },
      })
    },
    itemTextProps: normalize({ ...anatomy.attrs('item-text') }),
    itemBranchProps: normalize({ ...anatomy.attrs('item-branch'), 'aria-hidden': 'true', 'data-icon': 'chevron-right' satisfies IconName }),
    itemIndicatorProps: normalize({ ...anatomy.attrs('item-indicator'), 'aria-hidden': 'true', 'data-icon': 'check' satisfies IconName }),
    hasChildren,
    hiddenInputProps: normalize({ type: 'hidden', name: options.name, form: options.form, value: state.value[state.value.length - 1] ?? '' }),
    clear: () => send({ type: 'CLEAR' }),
  }
}

export type CascaderApi<T = Dict> = ReturnType<typeof connect<T>>

/** Put the real focus on the highlighted option, if the focus is in the dialog already. */
export function focusCascaderItem(content: HTMLElement | null, id: string | null, enter = false): void {
  if (!content || !id) return
  const active = content.ownerDocument.activeElement
  if (!enter && (!active || !content.contains(active))) return
  const item = content.ownerDocument.getElementById(id)
  if (!item) return
  if (item !== active) item.focus({ preventScroll: true })
  // Where the columns outrun a narrow screen the card scrolls sideways: bring
  // the item's column into it, and the item into its column. Never the page.
  const column = item.parentElement
  if (column && column !== content) {
    reveal(column, item, 'block')
    reveal(content, column, 'inline')
  }
}

function reveal(scroller: HTMLElement, target: HTMLElement, axis: 'block' | 'inline'): void {
  const outer = scroller.getBoundingClientRect()
  const inner = target.getBoundingClientRect()
  if (axis === 'block') {
    if (inner.top < outer.top) scroller.scrollTop -= outer.top - inner.top
    else if (inner.bottom > outer.bottom) scroller.scrollTop += inner.bottom - outer.bottom
  } else {
    if (inner.right > outer.right) scroller.scrollLeft += inner.right - outer.right
    if (inner.left < outer.left) scroller.scrollLeft -= outer.left - inner.left
  }
}
