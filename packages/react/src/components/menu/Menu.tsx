import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import {
  connect,
  createMenuMachine,
  hasIndicator,
  menuHighlightedId,
  type MenuApi,
  type MenuChangeDetails,
  type MenuEntry,
  type MenuItem,
  type MenuPlacement,
  type MenuSelectDetails,
} from '@ggary/core/menu'
import { attachPopover, focusMenuItem, reactNormalizer, scrollIntoViewIfNeeded, type AttachedPopover, type Dict } from '@ggary/core'

export interface MenuProps {
  /** Actions, checkbox and radio items, separators and labelled groups. */
  items: MenuEntry[]
  /** The anchor and opener: spread the props onto a button. */
  trigger: (props: Dict) => ReactNode
  /** Called with the item's value when the user activates it. */
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

  const contentRef = useRef<HTMLDivElement>(null)
  const attached = useRef<AttachedPopover | null>(null)

  // Passive effects, not layout effects as Popover's: the menu's items stay
  // mounted while it is closed, and React restores focus to the element that
  // had it before a commit once the commit's layout cleanups have run — so a
  // focus return from a layout cleanup lands back on the item. Passive effects
  // run after that restore, and still before paint for a click or a key.
  useEffect(() => {
    const content = contentRef.current
    const reference = document.getElementById(api.ids.trigger)
    if (!state.open || !content || !reference) return
    const instance = attachPopover(reference, content, {
      placement: machine.getState().placement,
      gutter: 4,
      // Focus goes back to the trigger on close; where it goes on open is the
      // highlight's business, below.
      manageFocus: true,
      onDismiss: (reason) => machine.send({ type: 'CLOSE', reason }),
      // The size limit arrives after the focus below: scroll again against it.
      onPlaced: () => scrollIntoViewIfNeeded(document.getElementById(menuHighlightedId(machine.getState()) ?? ''), content),
    })
    attached.current = instance
    return () => {
      instance.destroy()
      attached.current = null
    }
  }, [machine, state.open])

  useEffect(() => {
    attached.current?.update({ placement: state.placement })
  }, [state.placement])

  // After the attach above, so the menu is shown and can take focus.
  useEffect(() => {
    if (state.open && contentRef.current) focusMenuItem(contentRef.current, api.highlightedId)
  }, [state.open, api.highlightedId])

  return (
    <>
      {trigger(api.triggerProps)}
      <div ref={contentRef} {...api.contentProps}>
        {api.nodes.map((node) => {
          if (node.kind === 'separator') return <div key={node.key} {...api.separatorProps} />
          if (node.kind === 'item') return <Item key={node.key} api={api} item={node.item} index={node.index} />
          return (
            <div key={node.key} {...api.getGroupProps(node)}>
              {node.label && <div {...api.getGroupLabelProps(node)}>{node.label}</div>}
              {node.items.map(({ item, index }) => (
                <Item key={item.value} api={api} item={item} index={index} />
              ))}
            </div>
          )
        })}
      </div>
    </>
  )
}

function Item({ api, item, index }: { api: MenuApi; item: MenuItem; index: number }) {
  const props = api.getItemProps(item, index)
  const children = (
    <>
      <span {...api.getItemTextProps()}>{item.label}</span>
      {item.shortcut && <span {...api.getItemShortcutProps()}>{item.shortcut}</span>}
      {hasIndicator(item) && <span {...api.getItemIndicatorProps(item)} />}
    </>
  )
  return props.href ? <a {...props}>{children}</a> : <div {...props}>{children}</div>
}
