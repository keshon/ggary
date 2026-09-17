import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import {
  connect,
  createMenuMachine,
  type MenuChangeDetails,
  type MenuEntry,
  type MenuPlacement,
  type MenuSelectDetails,
} from '@ggary/core/menu'
import { reactNormalizer, type Dict } from '@ggary/core'
import { MenuContent } from './MenuContent'

export interface MenuProps {
  /** Actions, checkbox and radio items, submenus, separators and labelled groups. */
  items: MenuEntry[]
  /** The anchor and opener: spread the props onto a button. */
  trigger: (props: Dict) => ReactNode
  /** Called with the item's value when the user activates it, at any depth. */
  onSelect?: (value: string, details: MenuSelectDetails) => void
  /** Controlled. Omit and use `defaultOpen` for uncontrolled. */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: MenuChangeDetails) => void
  placement?: MenuPlacement
  /** Close after an item is activated. Default true; an item can override it. */
  closeOnSelect?: boolean
  /** The menu's accessible name. Default: the trigger's text. */
  label?: string
}

export function Menu(props: MenuProps) {
  const { items, trigger, onSelect, open, defaultOpen, onOpenChange, placement, closeOnSelect, label } = props

  const id = `gg-menu-${useId().replace(/:/g, '')}`
  const callbacks = useRef({ onOpenChange, onSelect })
  callbacks.current = { onOpenChange, onSelect }

  const [machine] = useState(() =>
    createMenuMachine({
      id, items, open, defaultOpen, placement, closeOnSelect,
      onOpenChange: (next, details) => callbacks.current.onOpenChange?.(next, details),
      onSelect: (value, details) => callbacks.current.onSelect?.(value, details),
    })
  )
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const api = connect(state, machine.send, reactNormalizer, { label })

  useEffect(() => machine.send({ type: 'SYNC_ITEMS', items }), [machine, items])
  useEffect(() => {
    if (open !== undefined) machine.send({ type: 'SYNC_OPEN', open })
  }, [machine, open])
  useEffect(() => machine.send({ type: 'SYNC_OPTIONS', placement, closeOnSelect }), [machine, placement, closeOnSelect])

  return (
    <>
      {trigger(api.triggerProps)}
      <MenuContent api={api} getState={machine.getState} reference={() => document.getElementById(api.ids.trigger)} />
    </>
  )
}
