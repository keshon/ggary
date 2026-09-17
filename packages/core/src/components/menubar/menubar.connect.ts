import type { Dict, Normalizer } from '../../types'
import { parseMnemonic } from '../../utils/mnemonic'
import { connect as connectMenu, menuIds } from '../menu/menu.connect'
import type { MenuEvent } from '../menu/menu.types'
import { menubarAnatomy } from './menubar.anatomy'
import { menubarMenuId } from './menubar.machine'
import type { MenubarEvent, MenubarMenu, MenubarState } from './menubar.types'

export const menubarIds = (id: string) => ({
  root: id,
  /** A bar item is its menu's trigger, so the menu is labelled by it. */
  item: (index: number) => menuIds(menubarMenuId(id, index)).trigger,
  content: (index: number) => menuIds(menubarMenuId(id, index)).content(),
})

export interface MenubarConnectOptions {
  /** The bar's accessible name, such as "Application". */
  label?: string
  /** Access keys are live: say so to assistive tech with aria-keyshortcuts. */
  mnemonics?: boolean
}

/**
 * A menubar (WAI-ARIA APG): a row of menus with one tab stop. Arrows walk the
 * bar; Enter, Space or ArrowDown opens a menu. While one is open the keyboard
 * and the pointer move between menus directly — ArrowRight on a row with no
 * submenu opens the next menu, and hovering another bar item opens that one.
 *
 * Each menu is the Menu machine and its connect, with the bar item as its
 * trigger; the bar only decides which menu is open.
 */
export function connect<T = Dict>(
  state: MenubarState,
  send: (event: MenubarEvent) => void,
  normalize: Normalizer<T>,
  options: MenubarConnectOptions = {}
) {
  const ids = menubarIds(state.id)

  const onItemKeyDown = (index: number) => (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault()
        send({ type: 'MOVE', step: 1 })
        return
      case 'ArrowLeft':
        event.preventDefault()
        send({ type: 'MOVE', step: -1 })
        return
      case 'Home':
        event.preventDefault()
        send({ type: 'EDGE', edge: 'first' })
        return
      case 'End':
        event.preventDefault()
        send({ type: 'EDGE', edge: 'last' })
        return
      case 'ArrowDown':
      case 'Enter':
      case ' ':
        // Cancelling Enter and Space also cancels their click, which would toggle.
        event.preventDefault()
        send({ type: 'OPEN', index, focus: 'first' })
        return
      case 'ArrowUp':
        event.preventDefault()
        send({ type: 'OPEN', index, focus: 'last' })
        return
      case 'Escape':
        send({ type: 'SHOW_MNEMONICS', show: false })
        return
    }
  }

  return {
    ids,
    openIndex: state.openIndex,
    focusIndex: state.focusIndex,
    mnemonicsShown: state.mnemonics,

    /** The open menu, connected with the bar item as its trigger. Meaningful while `openIndex` is not -1. */
    menu: connectMenu(state.menu, (event: MenuEvent) => send({ type: 'MENU', event }), normalize),

    /** A label split around its access key, for rendering the key in its own part. */
    labelOf: (menu: MenubarMenu) => {
      const { text, index, key } = parseMnemonic(menu.label)
      return index === -1
        ? { text, before: text, key: null, after: '' }
        : { text, before: text.slice(0, index), key, after: text.slice(index + 1) }
    },

    close: () => send({ type: 'CLOSE' }),
    /** For the page-wide keys (`attachMenubarKeys`). */
    showMnemonics: (show: boolean) => send({ type: 'SHOW_MNEMONICS', show }),

    rootProps: normalize({
      ...menubarAnatomy.attrs('root'),
      id: ids.root,
      role: 'menubar',
      'aria-label': options.label,
      'data-mnemonics': state.mnemonics ? '' : undefined,
    }),

    getItemProps: (menu: MenubarMenu, index: number) => {
      const open = state.openIndex === index
      const key = parseMnemonic(menu.label).key
      return normalize({
        ...menubarAnatomy.attrs('item'),
        id: ids.item(index),
        type: 'button',
        role: 'menuitem',
        'aria-haspopup': 'menu',
        'aria-expanded': open ? 'true' : 'false',
        'aria-controls': open ? ids.content(index) : undefined,
        'aria-disabled': menu.disabled ? 'true' : undefined,
        'aria-keyshortcuts': options.mnemonics && key ? `Alt+${key.toLocaleUpperCase()}` : undefined,
        tabIndex: index === state.focusIndex ? 0 : -1,
        'data-value': menu.value,
        'data-state': open ? 'open' : 'closed',
        'data-disabled': menu.disabled ? '' : undefined,
        onClick: () => send({ type: 'TOGGLE', index }),
        onKeyDown: onItemKeyDown(index),
        onPointerEnter: () => send({ type: 'HOVER', index }),
        onFocusIn: () => send({ type: 'FOCUS', index }),
      })
    },

    getItemTextProps: () => normalize({ ...menubarAnatomy.attrs('item-text') }),
    mnemonicProps: normalize({ ...menubarAnatomy.attrs('mnemonic') }),
  }
}

export type MenubarApi<T = Dict> = ReturnType<typeof connect<T>>
