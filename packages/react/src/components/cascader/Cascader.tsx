import { Fragment, useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { connect, createCascaderMachine, focusCascaderItem, type CascaderNode } from '@ggary/core/cascader'
import { attachPopover, reactNormalizer } from '@ggary/core'
import { useFormReset } from '../../utils/use-form-reset'

export interface CascaderProps {
  items: CascaderNode[]
  label?: string
  placeholder?: string
  /** The first column's name; the others are named by their parent. Default: the label. */
  rootLabel?: string
  /** Controlled: the chosen path, root first. Omit and use `defaultValue` for uncontrolled. */
  value?: string[] | null
  defaultValue?: string[] | null
  onValueChange?: (value: string[], nodes: CascaderNode[]) => void
  /** A branch may be chosen itself. Default false: leaves only. */
  selectParents?: boolean
  disabled?: boolean
  /** Submits the chosen leaf's value. */
  name?: string
}

/** A choice from a tree, one level to a column. */
export function Cascader(props: CascaderProps) {
  const { items, label, placeholder, rootLabel, value, defaultValue, onValueChange, selectParents, disabled, name } = props
  const id = `gg-cascader-${useId().replace(/:/g, '')}`
  const callbacks = useRef({ onValueChange })
  callbacks.current = { onValueChange }
  const [machine] = useState(() =>
    createCascaderMachine({ id, items, value, defaultValue, selectParents, disabled, onValueChange: (next, nodes) => callbacks.current.onValueChange?.(next, nodes) })
  )
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const api = connect(state, machine.send, reactNormalizer, { label, placeholder, rootLabel, name })

  useEffect(() => machine.send({ type: 'SYNC_ITEMS', items }), [machine, items])
  useEffect(() => machine.send({ type: 'SYNC_OPTIONS', selectParents, disabled }), [machine, selectParents, disabled])
  useEffect(() => {
    if (value !== undefined) machine.send({ type: 'SYNC_VALUE', value: value ?? [] })
  }, [machine, value])

  const triggerRef = useRef<HTMLButtonElement>(null)
  const positionerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  useFormReset(triggerRef, () => {
    if (value === undefined) machine.send({ type: 'SYNC_VALUE', value: defaultValue ?? [] })
  })

  useLayoutEffect(() => {
    const positioner = positionerRef.current
    if (!state.open || !triggerRef.current || !positioner) return
    const popover = attachPopover(triggerRef.current, positioner, {
      placement: 'bottom-start',
      gutter: 4,
      sameWidth: false,
      onDismiss: () => machine.send({ type: 'CLOSE' }),
    })
    // Into the dialog, onto the highlighted item.
    focusCascaderItem(contentRef.current, api.focusedId, true)
    return () => {
      const active = document.activeElement
      const inside = !active || active === document.body || positioner.contains(active)
      popover.destroy()
      if (inside) triggerRef.current?.focus({ preventScroll: true })
    }
  }, [machine, state.open])

  useLayoutEffect(() => focusCascaderItem(contentRef.current, api.focusedId), [api.focusedId])

  return (
    <div {...api.rootProps}>
      {label && <label {...api.labelProps}>{label}</label>}
      <button ref={triggerRef} {...api.triggerProps}>
        <span {...api.valueProps}>
          {api.chosen.length === 0
            ? api.placeholder
            : api.chosen.map((node, i) => (
                <Fragment key={node.value}>
                  {i > 0 && <span {...api.separatorProps} />}
                  <span>{node.label}</span>
                </Fragment>
              ))}
        </span>
        <span {...api.indicatorProps} />
      </button>
      <div ref={positionerRef} {...api.positionerProps}>
        <div ref={contentRef} {...api.contentProps}>
          {api.columns.map((column, level) => (
            <ul key={level} {...api.getColumnProps(level)}>
              {column.map((node) => (
                <li key={node.value} {...api.getItemProps(node, level)}>
                  <span {...api.itemTextProps}>{node.label}</span>
                  {api.hasChildren(node) ? <span {...api.itemBranchProps} /> : <span {...api.itemIndicatorProps} />}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      {name && <input {...api.hiddenInputProps} />}
    </div>
  )
}
