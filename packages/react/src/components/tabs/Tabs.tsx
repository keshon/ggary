import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import {
  connect,
  createTabsMachine,
  type TabItem,
  type TabsActivation,
  type TabsOrientation,
  type TabsVariant,
} from '@ggary/core/tabs'
import { focusTab, reactNormalizer } from '@ggary/core'
import type { ControlSize } from '@ggary/core'
import { useConfigured } from '../config-provider'

export interface TabsProps {
  /** `sm`, `md` or `lg`, as Input's and Button's. Default `md`. */
  size?: ControlSize
  items: TabItem[]
  /** Controlled. Omit and use `defaultValue` for uncontrolled. */
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string) => void
  /** A close button, Delete or a middle click on a closable tab. Remove the item to close it. */
  onClose?: (value: string) => void
  /** The tab list's accessible name. */
  label?: string
  orientation?: TabsOrientation
  activation?: TabsActivation
  /** `sections` for views of one thing, `documents` for open, closable items. Default `sections`. */
  variant?: TabsVariant
  /** The panel for a tab. Omit it for tabs that switch something rendered elsewhere. */
  children?: (item: TabItem) => ReactNode
  /** Render every panel, hidden, rather than the selected one alone. Keeps their state. */
  keepMounted?: boolean
  closeLabel?: (label: string) => string
}

export function Tabs(props: TabsProps) {
  props = useConfigured(props, { size: true })
  const {
    size,
    items, value, defaultValue, onValueChange, onClose, label, orientation, activation, variant,
    children, keepMounted = false, closeLabel,
  } = props

  const id = `gg-tabs-${useId().replace(/:/g, '')}`
  const callbacks = useRef({ onValueChange, onClose })
  callbacks.current = { onValueChange, onClose }

  const [machine] = useState(() =>
    createTabsMachine({
      id, items, value, defaultValue, orientation, activation,
      onValueChange: (next) => callbacks.current.onValueChange?.(next),
      onClose: (closed) => callbacks.current.onClose?.(closed),
    })
  )
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const api = connect(state, machine.send, reactNormalizer, { label, variant, panels: children !== undefined, closeLabel, size })

  useEffect(() => machine.send({ type: 'SYNC_ITEMS', items }), [machine, items])
  useEffect(() => {
    if (value !== undefined) machine.send({ type: 'SYNC_VALUE', value })
  }, [machine, value])
  useEffect(() => machine.send({ type: 'SYNC_OPTIONS', orientation, activation }), [machine, orientation, activation])

  // Roving focus moves only when the machine asks (the nonce), never on a re-render.
  const lastFocusNonce = useRef(0)
  useLayoutEffect(() => {
    if (api.focusNonce === 0 || api.focusNonce === lastFocusNonce.current || api.focusValue === null) return
    lastFocusNonce.current = api.focusNonce
    focusTab(document, api.ids.tab(api.focusValue))
  })

  return (
    <div {...api.rootProps}>
      <div {...api.listProps}>
        {api.items.map((item) => (
          <div key={item.value} {...api.getTabProps(item)}>
            <span {...api.getTabTextProps()}>{item.label}</span>
            {item.closable && (
              <button {...api.getCloseProps(item)}>
                <span {...api.closeIconProps} />
              </button>
            )}
          </div>
        ))}
      </div>
      {children &&
        api.items.map((item) =>
          keepMounted || item.value === state.value ? (
            <div key={item.value} {...api.getPanelProps(item)}>
              {children(item)}
            </div>
          ) : null
        )}
    </div>
  )
}
