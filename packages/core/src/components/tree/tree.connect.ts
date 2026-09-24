import type { IconName } from '@ggary/icons'
import type { Dict, Normalizer } from '../../types'
import { treeAnatomy } from './tree.anatomy'
import type { TreeConnectOptions, TreeEvent, TreeRow, TreeState } from './tree.types'
import { hasChildren, isDisabled, tabStop, visibleRows } from './tree.machine'

const idPart = (value: string) => value.replace(/[^\w-]/g, (char) => `_${char.charCodeAt(0).toString(16)}`)

export const treeIds = (id: string) => ({
  root: id,
  item: (value: string) => `${id}-item-${idPart(value)}`,
})

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
