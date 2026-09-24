import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { connect as connectTarget, contextMenuAnchor } from '@ggary/core/context-menu'
import { connect as connectMenu, createMenuMachine, type MenuEntry, type MenuSelectDetails } from '@ggary/core/menu'
import { reactNormalizer, type Dict, type VirtualElement } from '@ggary/core'
import { MenuContent } from '../menu/MenuContent'

export interface ContextMenuProps {
  /** Actions, checkbox and radio items, submenus, separators and groups: a Menu's. */
  items: MenuEntry[]
  onSelect?: (value: string, details: MenuSelectDetails) => void
  /**
   * The element the menu belongs to: spread the props onto it. Give it a
   * tabIndex if it is not focusable already — the keyboard opens the menu from
   * it, and the focus comes back to it. Merge with mergeProps if it has an
   * onKeyDown of its own.
   */
  trigger: (props: Dict) => ReactNode
  /** The menu's accessible name. Default "Actions". */
  label?: string
  closeOnSelect?: boolean
}

export function ContextMenu({ items, onSelect, trigger, label = 'Actions', closeOnSelect }: ContextMenuProps) {
  const id = `gg-context-menu-${useId().replace(/:/g, '')}`
  const callbacks = useRef({ onSelect })
  callbacks.current = { onSelect }
  const element = useRef<HTMLElement | null>(null)
  const anchor = useRef<HTMLElement | VirtualElement | null>(null)

  const [machine] = useState(() =>
    createMenuMachine({ id, items, closeOnSelect, onSelect: (value, details) => callbacks.current.onSelect?.(value, details) })
  )
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const api = connectMenu(state, machine.send, reactNormalizer, { label })

  useEffect(() => machine.send({ type: 'SYNC_ITEMS', items }), [machine, items])
  useEffect(() => machine.send({ type: 'SYNC_OPTIONS', closeOnSelect }), [machine, closeOnSelect])

  const target = connectTarget({ open: state.open }, reactNormalizer, {
    onRequest: (request) => {
      element.current = request.element
      anchor.current = contextMenuAnchor(request)
      // The keyboard lands on the first item; a pointer, on the menu itself.
      machine.send({ type: 'OPEN', reason: 'api', focus: request.point ? 'none' : 'first' })
    },
  })

  return (
    <>
      {trigger(target.targetProps)}
      <MenuContent api={api} getState={machine.getState} reference={() => element.current} anchor={() => anchor.current} dismissOnReference />
    </>
  )
}
