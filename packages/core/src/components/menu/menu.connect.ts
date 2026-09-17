import type { IconName } from '@ggary/icons'
import type { Dict, Normalizer } from '../../types'
import { menuAnatomy } from './menu.anatomy'
import { flattenMenu, gracePolygon, isSubmenu, menuNodes, type MenuNode } from './menu.collection'
import type { MenuEvent, MenuItem, MenuPoint, MenuState, MenuSubmenuItem } from './menu.types'

/** A row's address: its index in each level from the menu down. A bare number is a row of the menu itself. */
export type MenuPath = number | readonly number[]

const toPath = (at: MenuPath): readonly number[] => (typeof at === 'number' ? [at] : at)

export const menuIds = (id: string) => ({
  trigger: `${id}-trigger`,
  /** The menu for `path` empty, or the submenu of the row at `path`. */
  content: (path: readonly number[] = []) => (path.length ? `${id}-content-${path.join('-')}` : `${id}-content`),
  item: (at: MenuPath) => `${id}-item-${toPath(at).join('-')}`,
  groupLabel: (key: string, path: readonly number[] = []) => `${id}-${[...path, key].join('-')}-label`,
})

export interface MenuFocusTarget {
  /** The menu or submenu that holds focus. */
  contentId: string
  /** Its highlighted row, or null when focus is on the menu itself. */
  itemId: string | null
}

/** Where focus belongs, or null while closed. Adapters hand it to `focusMenuTarget`. */
export function menuFocusTarget(state: MenuState): MenuFocusTarget | null {
  if (!state.open || state.path.length === 0) return null
  const ids = menuIds(state.id)
  const level = Math.min(state.focusLevel, state.path.length - 1)
  const prefix = state.path.slice(0, level)
  const index = state.path[level]
  return { contentId: ids.content(prefix), itemId: index >= 0 ? ids.item([...prefix, index]) : null }
}

export interface MenuConnectOptions {
  /** The menu's accessible name. Without it the menu is named by its trigger. */
  label?: string
}

/** A single printable character, not a named key like "ArrowDown" or "Tab". */
const isPrintable = (key: string) => key.length === 1 && key !== ' '

const ROLES = { item: 'menuitem', checkbox: 'menuitemcheckbox', radio: 'menuitemradio', submenu: 'menuitem' } as const

/** How long a pointer may take to cross the corridor to a submenu, in ms. */
const GRACE_MS = 300

/**
 * Where the pointer was last seen over each menu, by its panel. The corridor to
 * a submenu starts there, not at the pointerleave event: that event already
 * carries the pointer's new position, so a corridor drawn from it contains the
 * very move that left the row, whichever way it went. Kept outside state so a
 * moving pointer does not re-render the menu.
 */
const lastPointer = new WeakMap<Element, MenuPoint>()

/**
 * A menu button (WAI-ARIA APG): a button that opens a list of actions.
 *
 * Unlike Select, focus MOVES into the menu — each highlighted item takes real
 * focus — because a menu is a place the user goes to, and an item that is a
 * link has to be focused for the browser to follow it. The highlight is still
 * machine state: the pointer and the keyboard move the same rows, and the
 * adapter focuses whatever `focusTarget` names.
 *
 * Submenus are levels of the same machine, not menus of their own: one keydown
 * handler on the menu hears every level (their keys bubble to it), and the
 * menu alone is on the dismiss stack. Each submenu is rendered right after its
 * row, inside the menu, so a press inside it is inside the menu.
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
  const stateAttr = state.open ? 'open' : 'closed'

  /** Whether the row at `path` is on the highlighted path. */
  const isOnPath = (path: readonly number[]) =>
    state.path.length >= path.length && path.every((index, level) => state.path[level] === index)
  const isSubmenuOpen = (path: readonly number[]) => state.path.length > path.length && isOnPath(path)

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
      // Whether there is a submenu to open or close is the reducer's call, made
      // on the state the key actually meets: two keys can arrive before the
      // adapter has rendered the first. Where neither does anything, a menubar
      // moves to the neighbouring menu.
      case 'ArrowRight':
        event.preventDefault()
        send({ type: 'SUBMENU_OPEN' })
        return
      case 'ArrowLeft':
        event.preventDefault()
        send({ type: 'SUBMENU_CLOSE' })
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
    /** Where focus belongs while open. */
    focusTarget: menuFocusTarget(state),
    items: flattenMenu(state.items),
    nodes: menuNodes(state.items) as MenuNode[],
    /** The rows of a submenu, to render under it. */
    nodesOf: (item: MenuSubmenuItem) => menuNodes(item.items) as MenuNode[],
    isSubmenuOpen: (at: MenuPath) => isSubmenuOpen(toPath(at)),

    show: () => send({ type: 'OPEN', reason: 'api' }),
    close: () => send({ type: 'CLOSE', reason: 'api' }),
    /** What the menu's dismiss layer reports: Escape closes one level, a press outside closes the menu. */
    dismiss: (reason: 'escape' | 'outside') => send(reason === 'escape' ? { type: 'ESCAPE' } : { type: 'CLOSE', reason }),

    // Behaviour and ARIA only, as Popover's trigger: the button's look belongs
    // to whatever component renders it.
    triggerProps: normalize({
      id: ids.trigger,
      type: 'button',
      'aria-haspopup': 'menu',
      'aria-expanded': state.open ? 'true' : 'false',
      'aria-controls': ids.content(),
      onClick: () => send({ type: 'TOGGLE', reason: 'trigger', focus: 'none' }),
      onKeyDown: onTriggerKeyDown,
    }),

    contentProps: normalize({
      ...menuAnatomy.attrs('content'),
      id: ids.content(),
      role: 'menu',
      'aria-label': options.label,
      'aria-labelledby': options.label ? undefined : ids.trigger,
      tabIndex: -1,
      popover: 'manual',
      'data-state': stateAttr,
      onKeyDown: onContentKeyDown,
      // Rows and submenus bubble their moves here.
      onPointerMove: (event: PointerEvent) => {
        if (event.currentTarget) lastPointer.set(event.currentTarget as Element, { x: event.clientX, y: event.clientY })
      },
    }),

    /** The submenu of the row at `path`: rendered only while open, right after that row. */
    getSubmenuProps: (at: MenuPath) => {
      const path = toPath(at)
      return normalize({
        ...menuAnatomy.attrs('content'),
        id: ids.content(path),
        role: 'menu',
        'aria-labelledby': ids.item(path),
        tabIndex: -1,
        popover: 'manual',
        'data-state': isSubmenuOpen(path) ? 'open' : 'closed',
        'data-level': String(path.length),
      })
    },

    getGroupProps: (node: Extract<MenuNode, { kind: 'group' }>, parent: readonly number[] = []) =>
      normalize({
        ...menuAnatomy.attrs('group'),
        role: 'group',
        'aria-labelledby': node.label ? ids.groupLabel(node.key, parent) : undefined,
      }),

    getGroupLabelProps: (node: Extract<MenuNode, { kind: 'group' }>, parent: readonly number[] = []) =>
      normalize({ ...menuAnatomy.attrs('group-label'), id: ids.groupLabel(node.key, parent), role: 'presentation' }),

    separatorProps: normalize({ ...menuAnatomy.attrs('separator'), role: 'separator' }),

    /** Render a link item as `<a>` with these props, every other item as a `<div>`. */
    getItemProps: (item: MenuItem, at: MenuPath) => {
      const path = toPath(at)
      const level = path.length - 1
      const index = path[level]
      const highlighted = isOnPath(path)
      const submenu = isSubmenu(item)
      const submenuOpen = submenu && isSubmenuOpen(path)
      return normalize({
        ...menuAnatomy.attrs('item'),
        id: ids.item(path),
        role: ROLES[item.type ?? 'item'],
        href: item.type === undefined || item.type === 'item' ? (item.disabled ? undefined : item.href) : undefined,
        tabIndex: -1,
        'aria-checked': checkedAttr(item),
        'aria-disabled': item.disabled ? 'true' : undefined,
        'aria-haspopup': submenu ? 'menu' : undefined,
        'aria-expanded': submenu ? (submenuOpen ? 'true' : 'false') : undefined,
        'aria-controls': submenuOpen ? ids.content(path) : undefined,
        'data-value': item.value,
        'data-type': item.type ?? 'item',
        'data-state': submenu ? (submenuOpen ? 'open' : 'closed') : checkedState(item),
        'data-tone': item.type === undefined || item.type === 'item' ? item.tone : undefined,
        'data-highlighted': highlighted ? '' : undefined,
        'data-disabled': item.disabled ? '' : undefined,
        onClick: (event: MouseEvent) => {
          if (item.disabled) {
            event.preventDefault()
            return
          }
          // detail is 0 for a click made by Enter or Space, and by `.click()`.
          send({ type: 'SELECT', level, index, pointer: event.detail > 0 })
        },
        // Move, not enter: an item scrolled under a resting pointer by the
        // keyboard must not steal the highlight back until the pointer moves.
        onPointerMove: (event: PointerEvent) => {
          if (highlighted && state.focusLevel === level && !(submenu && !submenuOpen)) return
          send({ type: 'HIGHLIGHT', level, index, pointer: { x: event.clientX, y: event.clientY, now: Date.now() } })
        },
        // Leaving for the menu's padding, a separator or outside drops the
        // highlight: a row that stays lit under no pointer reads as chosen.
        // Leaving a row whose submenu is open draws the corridor to it instead.
        onPointerLeave: (event: PointerEvent) => {
          if (!highlighted) return
          if (submenuOpen) {
            const doc = (event.currentTarget as Element | null)?.ownerDocument
            const rect = doc?.getElementById(ids.content(path))?.getBoundingClientRect()
            if (doc && rect && rect.width > 0) {
              const menu = doc.getElementById(ids.content())
              const from = (menu && lastPointer.get(menu)) ?? { x: event.clientX, y: event.clientY }
              const polygon = gracePolygon(from, rect)
              send({ type: 'GRACE', grace: { level, polygon, until: Date.now() + GRACE_MS } })
            }
            return
          }
          send({ type: 'UNHIGHLIGHT', level, index })
        },
      })
    },

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
    // Rendered for submenu rows.
    submenuIndicatorProps: normalize({
      ...menuAnatomy.attrs('submenu-indicator'),
      'data-icon': 'chevron-right' satisfies IconName,
      'aria-hidden': 'true',
    }),
  }
}

export type MenuApi<T = Dict> = ReturnType<typeof connect<T>>

/** Whether an item draws a check mark slot. */
export const hasIndicator = (item: MenuItem) => item.type === 'checkbox' || item.type === 'radio'
