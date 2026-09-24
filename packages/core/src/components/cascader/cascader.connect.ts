import type { IconName } from '@ggary/icons'
import type { Dict, Normalizer } from '../../types'
import { cascaderAnatomy } from './cascader.anatomy'
import type { CascaderConnectOptions, CascaderEvent, CascaderNode, CascaderState } from './cascader.types'
import { columnsOf, hasChildren, nodesOf } from './cascader.machine'

export const cascaderIds = (id: string) => ({
  root: id,
  label: `${id}-label`,
  trigger: `${id}-trigger`,
  value: `${id}-value`,
  content: `${id}-content`,
  column: (level: number) => `${id}-column-${level}`,
  item: (level: number, value: string) => `${id}-item-${level}-${value.replace(/[^\w-]/g, '_')}`,
})

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
    /** One level of the chosen path in the trigger. */
    valueItemProps: normalize({ ...anatomy.attrs('value-item') }),
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
    /**
     * A branch's chevron: a press target of its own that opens the branch's
     * column without choosing it — the way on a touch screen, where nothing
     * hovers, to a branch that may be chosen itself (`selectParents`).
     */
    getItemBranchProps: (node: CascaderNode, level: number) =>
      normalize({
        ...anatomy.attrs('item-branch'),
        'aria-hidden': 'true',
        'data-icon': 'chevron-right' satisfies IconName,
        onClick: (event: MouseEvent) => {
          event.stopPropagation()
          send({ type: 'HIGHLIGHT', level, value: node.value })
        },
      }),
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
