import { Fragment, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import { connect, createMenubarMachine, type MenubarMenu, type MenubarSelectDetails } from '@ggary/core/menubar'
import { attachMenubarKeys, reactNormalizer, rovingFocus } from '@ggary/core'
import { MenuContent } from '../menu/MenuContent'

export interface MenubarProps {
  /** The bar's menus. A label may mark its access key with `&`: `&File`. */
  menus: MenubarMenu[]
  /** Called with the item's value when the user activates it, in any menu at any depth. */
  onSelect?: (value: string, details: MenubarSelectDetails) => void
  /** Called with the value of the menu that opened, or null when the bar closes. */
  onOpenChange?: (menu: string | null) => void
  /** The bar's accessible name, such as "Application". */
  label?: string
  /**
   * Page-wide keys: Alt+key opens a menu by its access key, a held Alt
   * underlines the keys, F10 goes to the bar. Default false.
   */
  mnemonics?: boolean
  /** Close after an item is activated. Default true; an item can override it. */
  closeOnSelect?: boolean
}

export function Menubar(props: MenubarProps) {
  const { menus, onSelect, onOpenChange, label, mnemonics = false, closeOnSelect } = props

  const id = `gg-menubar-${useId().replace(/:/g, '')}`
  const callbacks = useRef({ onSelect, onOpenChange })
  callbacks.current = { onSelect, onOpenChange }

  const [machine] = useState(() =>
    createMenubarMachine({
      id, menus, closeOnSelect,
      onSelect: (value, details) => callbacks.current.onSelect?.(value, details),
      onOpenChange: (menu) => callbacks.current.onOpenChange?.(menu),
    })
  )
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const api = connect(state, machine.send, reactNormalizer, { label, mnemonics })

  useEffect(() => machine.send({ type: 'SYNC_MENUS', menus }), [machine, menus])
  useEffect(() => machine.send({ type: 'SYNC_OPTIONS', closeOnSelect }), [machine, closeOnSelect])

  // The tab stop moves with the arrows while no menu is open; focus follows it,
  // but only when it is already on the bar.
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (state.openIndex === -1 && root.current?.contains(document.activeElement)) {
      rovingFocus(document, api.ids.item(state.focusIndex))
    }
  }, [state.focusIndex, state.openIndex])

  useEffect(() => {
    if (!mnemonics) return
    return attachMenubarKeys(document, {
      onMnemonic: (key, code) => {
        const before = machine.getState()
        machine.send({ type: 'MNEMONIC', key, code })
        return machine.getState() !== before
      },
      onShowMnemonics: (show) => machine.send({ type: 'SHOW_MNEMONICS', show }),
      onFocusBar: () => {
        // Focus first, then close: a menu that closes with focus outside it hands nothing back.
        document.getElementById(api.ids.item(0))?.focus()
        machine.send({ type: 'ENTER_BAR' })
      },
    })
  }, [machine, mnemonics])

  return (
    <div ref={root} {...api.rootProps}>
      {menus.map((menu, index) => {
        const text = api.labelOf(menu)
        return (
          <Fragment key={menu.value}>
            <button {...api.getItemProps(menu, index)}>
              <span {...api.getItemTextProps()}>
                {text.before}
                {text.key && <span {...api.mnemonicProps}>{text.key}</span>}
                {text.after}
              </span>
            </button>
            {state.openIndex === index && (
              <MenuContent
                key={state.menu.id}
                api={api.menu}
                getState={() => machine.getState().menu}
                reference={() => document.getElementById(api.ids.item(index))}
              />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}
