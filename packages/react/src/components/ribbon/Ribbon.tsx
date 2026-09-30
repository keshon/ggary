import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type HTMLAttributes, type ReactNode } from 'react'
import {
  connect,
  connectGroup,
  connectSeparator,
  connectTool,
  createRibbonMachine,
  type RibbonItem,
  type RibbonVariant,
} from '@ggary/core/ribbon'
import { attachRibbonScrollers, attachToolbarKeys, focusTab, reactNormalizer } from '@ggary/core'
import { useConfigured } from '../config-provider'

export interface RibbonProps extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'children'> {
  items: RibbonItem[]
  /** Controlled. Omit and use `defaultValue` for uncontrolled. */
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string) => void
  /** The tab row's accessible name. */
  label?: string
  /** `strip` for one ruled band, `cards` for a card per group. Default `strip`. */
  variant?: RibbonVariant
  /** The panel for a tab: groups of the kit's own controls. */
  children?: (item: RibbonItem) => ReactNode
  /** Render every panel, hidden, rather than the selected one alone. Keeps their state. */
  keepMounted?: boolean
}

export function Ribbon(props: RibbonProps) {
  const { items, value, defaultValue, onValueChange, label, variant, children, keepMounted = false, ...rest } = useConfigured(props, {})
  const id = `gg-ribbon-${useId().replace(/:/g, '')}`
  const callbacks = useRef({ onValueChange })
  callbacks.current = { onValueChange }

  const [machine] = useState(() =>
    createRibbonMachine({
      id,
      items,
      value,
      defaultValue,
      onValueChange: (next) => callbacks.current.onValueChange?.(next),
    })
  )
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const api = connect(state, machine.send, reactNormalizer, { label, variant })

  useEffect(() => machine.send({ type: 'SYNC_ITEMS', items }), [machine, items])
  useEffect(() => {
    if (value !== undefined) machine.send({ type: 'SYNC_VALUE', value })
  }, [machine, value])

  // Fades and the horizontal wheel, over whatever panels are showing.
  const scrollRoot = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!scrollRoot.current) return
    return attachRibbonScrollers(scrollRoot.current)
  }, [])

  // Roving focus moves only when the machine asks (the nonce), never on a re-render.
  const lastFocusNonce = useRef(0)
  useLayoutEffect(() => {
    if (api.focusNonce === 0 || api.focusNonce === lastFocusNonce.current || api.focusValue === null) return
    lastFocusNonce.current = api.focusNonce
    focusTab(document, api.ids.tab(api.focusValue))
  })

  return (
    <div {...rest} {...api.rootProps} ref={scrollRoot}>
      <div {...api.tabListProps}>
        {api.items.map((item) => (
          <div key={item.value} {...api.getTabProps(item)}>
            <span {...api.getTabTextProps()}>{item.label}</span>
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

export interface RibbonGroupProps extends HTMLAttributes<HTMLDivElement> {
  label: string
  children: ReactNode
}

/** One named group of tools: its own toolbar over the kit's own controls. */
export function RibbonGroup({ label, children, ...rest }: RibbonGroupProps) {
  const group = connectGroup(label, reactNormalizer)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!root.current) return
    return attachToolbarKeys(root.current, 'horizontal')
  }, [])

  return (
    <div {...rest} {...group.groupProps} ref={root}>
      <div {...group.bodyProps}>{children}</div>
      <div {...group.labelProps}>{group.label}</div>
    </div>
  )
}

/** A line between groups. */
export function RibbonSeparator() {
  const { separatorProps } = connectSeparator(reactNormalizer)
  return <span {...separatorProps} />
}

/** A stacked tool: stands its button's icon over its label. The button stays the kit's own. */
export function RibbonTool({ children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const { toolProps } = connectTool(reactNormalizer)
  return (
    <div {...rest} {...toolProps}>
      {children}
    </div>
  )
}
