import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { connect, createTreeMachine, type TreeNode, type TreeSelectionMode } from '@ggary/core/tree'
import { reactNormalizer, rovingFocus, scrollIntoViewIfNeeded } from '@ggary/core'

export interface TreeProps {
  items: TreeNode[]
  /** The tree's accessible name. */
  label: string
  /** Controlled: the chosen nodes. Omit and use `defaultValue` for uncontrolled. */
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  /** Controlled: the open branches. Omit and use `defaultExpanded` for uncontrolled. */
  expanded?: string[]
  defaultExpanded?: string[]
  onExpandedChange?: (expanded: string[]) => void
  /** `single` (default), `multiple`, or `none` for a tree only walked and opened. */
  selectionMode?: TreeSelectionMode
  disabled?: boolean
  /** Draws a row's text; default the label. An icon before it, a count after. */
  children?: (node: TreeNode) => ReactNode
}

/** Nested items, a branch opened in place. */
export function Tree(props: TreeProps) {
  const { items, label, value, defaultValue, onValueChange, expanded, defaultExpanded, onExpandedChange, selectionMode, disabled, children } = props
  const id = `gg-tree-${useId().replace(/:/g, '')}`
  const callbacks = useRef({ onValueChange, onExpandedChange })
  callbacks.current = { onValueChange, onExpandedChange }
  const [machine] = useState(() =>
    createTreeMachine({
      id, items, value, defaultValue, expanded, defaultExpanded, selectionMode, disabled,
      onValueChange: (next) => callbacks.current.onValueChange?.(next),
      onExpandedChange: (next) => callbacks.current.onExpandedChange?.(next),
    })
  )
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const api = connect(state, machine.send, reactNormalizer, { label })

  useEffect(() => machine.send({ type: 'SYNC_ITEMS', items }), [machine, items])
  useEffect(() => machine.send({ type: 'SYNC_OPTIONS', selectionMode, disabled }), [machine, selectionMode, disabled])
  useEffect(() => {
    if (value !== undefined) machine.send({ type: 'SYNC_VALUE', value })
  }, [machine, value])
  useEffect(() => {
    if (expanded !== undefined) machine.send({ type: 'SYNC_EXPANDED', expanded })
  }, [machine, expanded])

  const rootRef = useRef<HTMLDivElement>(null)
  const lastFocusNonce = useRef(0)
  useLayoutEffect(() => {
    if (api.focusNonce === 0 || api.focusNonce === lastFocusNonce.current || api.focusValue === null) return
    lastFocusNonce.current = api.focusNonce
    const itemId = api.ids.item(api.focusValue)
    rovingFocus(document, itemId)
    scrollIntoViewIfNeeded(document.getElementById(itemId), rootRef.current)
  })

  return (
    <div ref={rootRef} {...api.rootProps}>
      {api.rows.map((row) => (
        <div key={row.node.value} {...api.getItemProps(row)}>
          <span {...api.getToggleProps(row)} />
          <span {...api.itemTextProps}>{children ? children(row.node) : row.node.label}</span>
          {state.selectionMode === 'multiple' && <span {...api.itemIndicatorProps} />}
        </div>
      ))}
    </div>
  )
}
