import type { IconName } from '@ggary/icons'
import type { Dict, Normalizer } from '../../types'
import { menuAnatomy } from './menu.anatomy'
import { flattenMenu, menuNodes, type MenuNode } from './menu.collection'
import type { MenuEvent, MenuItem, MenuState } from './menu.types'

export const menuIds = (id: string) => ({
  trigger: `${id}-trigger`,
  content: `${id}-content`,
  item: (index: number) => `${id}-item-${index}`,
  groupLabel: (key: string) => `${id}-${key}-label`,
})

/** The item that should hold focus, or null for the menu itself. */
export const menuHighlightedId = (state: MenuState) =>
  state.open && state.highlightedIndex >= 0 ? menuIds(state.id).item(state.highlightedIndex) : null

export interface MenuConnectOptions {
  /** The menu's accessible name. Without it the menu is named by its trigger. */
  label?: string
}

/** A single printable character, not a named key like "ArrowDown" or "Tab". */
const isPrintable = (key: string) => key.length === 1 && key !== ' '

const ROLES = { item: 'menuitem', checkbox: 'menuitemcheckbox', radio: 'menuitemradio' } as const

/**
 * A menu button (WAI-ARIA APG): a button that opens a list of actions.
 *
 * Unlike Select, focus MOVES into the menu — each highlighted item takes real
 * focus — because a menu is a place the user goes to, and an item that is a
 * link has to be focused for the browser to follow it. The highlight is still
 * machine state: the pointer and the keyboard move the same index, and the
 * adapter focuses whatever it points at (`focusMenuItem`).
 *
 * Showing, placing and dismissing are `attachPopover`'s, as for Popover.
 */
export function connect<T = Dict>(
  state: MenuState,
  send: (event: MenuEvent) => void,
  normalize: Normalizer<T>,
  options: MenuConnectOptions = {}
) {
  const ids = menuIds(state.id)
  const items = flattenMenu(state.items)
  const stateAttr = state.open ? 'open' : 'closed'
  const highlighted = state.highlightedIndex

  const onTriggerKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
      case 'Enter':
      case ' ':
        // Cancelling Enter and Space also cancels the click they would make,
        // which would toggle the menu shut again.
        event.preventDefault()
        send(state.open ? { type: 'HIGHLIGHT_EDGE', edge: 'first' } : { type: 'OPEN', focus: 'first' })
        return
      case 'ArrowUp':
        event.preventDefault()
        send(state.open ? { type: 'HIGHLIGHT_EDGE', edge: 'last' } : { type: 'OPEN', focus: 'last' })
        return
    }
  }

  const onContentKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        send({ type: 'HIGHLIGHT_MOVE', step: 1 })
        return
      case 'ArrowUp':
        event.preventDefault()
        send({ type: 'HIGHLIGHT_MOVE', step: -1 })
        return
      case 'Home':
      case 'PageUp':
        event.preventDefault()
        send({ type: 'HIGHLIGHT_EDGE', edge: 'first' })
        return
      case 'End':
      case 'PageDown':
        event.preventDefault()
        send({ type: 'HIGHLIGHT_EDGE', edge: 'last' })
        return
      case 'Enter':
      case ' ': {
        // Activation always goes through a click, so a link item navigates as
        // a link does and every item has one path to SELECT.
        const item = (event.target as Element | null)?.closest?.<HTMLElement>('[role^="menuitem"]')
        if (!item) return
        event.preventDefault()
        item.click()
        return
      }
      case 'Tab':
        // The menu closes and focus goes back to its trigger; the next Tab
        // leaves from there. Moving on from inside a closing popover would land
        // wherever the popover happens to sit in the DOM.
        event.preventDefault()
        send({ type: 'CLOSE', reason: 'tab' })
        return
      default:
        if (!isPrintable(event.key) || event.ctrlKey || event.metaKey || event.altKey) return
        event.preventDefault()
        send({ type: 'TYPE', char: event.key, now: Date.now() })
    }
  }

  const checkedAttr = (item: MenuItem) =>
    item.type === 'checkbox' || item.type === 'radio' ? (item.checked ? 'true' : 'false') : undefined
  const checkedState = (item: MenuItem) =>
    item.type === 'checkbox' || item.type === 'radio' ? (item.checked ? 'checked' : 'unchecked') : undefined

  return {
    ids,
    open: state.open,
    placement: state.placement,
    highlightedIndex: highlighted,
    /** The id of the item that should hold focus, or null for the menu itself. */
    highlightedId: menuHighlightedId(state),
    items,
    nodes: menuNodes(state.items) as MenuNode[],

    show: () => send({ type: 'OPEN', reason: 'api' }),
    close: () => send({ type: 'CLOSE', reason: 'api' }),
    dismiss: (reason: 'escape' | 'outside') => send({ type: 'CLOSE', reason }),

    // Behaviour and ARIA only, as Popover's trigger: the button's look belongs
    // to whatever component renders it.
    triggerProps: normalize({
      id: ids.trigger,
      type: 'button',
      'aria-haspopup': 'menu',
      'aria-expanded': state.open ? 'true' : 'false',
      'aria-controls': ids.content,
      onClick: () => send({ type: 'TOGGLE', reason: 'trigger', focus: 'none' }),
      onKeyDown: onTriggerKeyDown,
    }),

    contentProps: normalize({
      ...menuAnatomy.attrs('content'),
      id: ids.content,
      role: 'menu',
      'aria-label': options.label,
      'aria-labelledby': options.label ? undefined : ids.trigger,
      tabIndex: -1,
      popover: 'manual',
      'data-state': stateAttr,
      onKeyDown: onContentKeyDown,
    }),

    getGroupProps: (node: Extract<MenuNode, { kind: 'group' }>) =>
      normalize({
        ...menuAnatomy.attrs('group'),
        role: 'group',
        'aria-labelledby': node.label ? ids.groupLabel(node.key) : undefined,
      }),

    getGroupLabelProps: (node: Extract<MenuNode, { kind: 'group' }>) =>
      normalize({ ...menuAnatomy.attrs('group-label'), id: ids.groupLabel(node.key), role: 'presentation' }),

    separatorProps: normalize({ ...menuAnatomy.attrs('separator'), role: 'separator' }),

    /** Render a link item as `<a>` with these props, every other item as a `<div>`. */
    getItemProps: (item: MenuItem, index: number) =>
      normalize({
        ...menuAnatomy.attrs('item'),
        id: ids.item(index),
        role: ROLES[item.type ?? 'item'],
        href: item.type !== 'checkbox' && item.type !== 'radio' && !item.disabled ? item.href : undefined,
        tabIndex: -1,
        'aria-checked': checkedAttr(item),
        'aria-disabled': item.disabled ? 'true' : undefined,
        'data-value': item.value,
        'data-type': item.type ?? 'item',
        'data-state': checkedState(item),
        'data-tone': item.type !== 'checkbox' && item.type !== 'radio' ? item.tone : undefined,
        'data-highlighted': index === highlighted ? '' : undefined,
        'data-disabled': item.disabled ? '' : undefined,
        onClick: (event: MouseEvent) => {
          if (item.disabled) {
            event.preventDefault()
            return
          }
          send({ type: 'SELECT', index })
        },
        // Move, not enter: an item scrolled under a resting pointer by the
        // keyboard must not steal the highlight back until the pointer moves.
        onPointerMove: () => {
          if (index !== highlighted) send({ type: 'HIGHLIGHT', index })
        },
        // Leaving for the menu's padding, a separator or outside drops the
        // highlight: a row that stays lit under no pointer reads as chosen.
        // Moving to the next item leaves this one first, then moves there.
        onPointerLeave: () => {
          if (index === highlighted) send({ type: 'HIGHLIGHT', index: -1 })
        },
      }),

    getItemTextProps: () => normalize({ ...menuAnatomy.attrs('item-text') }),
    getItemShortcutProps: () => normalize({ ...menuAnatomy.attrs('item-shortcut') }),
    // Core names the glyph; the theme draws it. Rendered for checkbox and radio items.
    getItemIndicatorProps: (item: MenuItem) =>
      normalize({
        ...menuAnatomy.attrs('item-indicator'),
        'data-icon': 'check' satisfies IconName,
        'aria-hidden': 'true',
        'data-state': checkedState(item),
      }),
  }
}

export type MenuApi<T = Dict> = ReturnType<typeof connect<T>>

/** Whether an item draws a check mark slot. */
export const hasIndicator = (item: MenuItem) => item.type === 'checkbox' || item.type === 'radio'
