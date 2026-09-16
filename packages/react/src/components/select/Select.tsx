import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import {
  connect,
  createSelectMachine,
  type SelectItem,
} from '@ggary/core/select'
import { attachPositioner, reactNormalizer, scrollIntoViewIfNeeded, trackDismissable } from '@ggary/core'

export interface SelectProps {
  items: SelectItem[]
  label?: string
  placeholder?: string
  /** Controlled. Omit and use `defaultValue` for uncontrolled. */
  value?: string | null
  defaultValue?: string | null
  disabled?: boolean
  name?: string
  onValueChange?: (value: string | null, item: SelectItem | null) => void
}

export function Select(props: SelectProps) {
  const { items, label, placeholder, value, defaultValue, disabled = false, name, onValueChange } = props

  const reactId = useId()
  const id = `gg-select-${reactId.replace(/:/g, '')}`

  // Callbacks change every render; the machine is created once. A ref is the
  // seam between the two.
  const callbacks = useRef({ onValueChange })
  callbacks.current = { onValueChange }

  const [machine] = useState(() =>
    createSelectMachine({
      id,
      items,
      value,
      defaultValue,
      disabled,
      onValueChange: (next, item) => callbacks.current.onValueChange?.(next, item),
    })
  )

  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const api = connect(state, machine.send, reactNormalizer, { placeholder, name })

  // Props flow in as events. The machine never reads props directly.
  useEffect(() => machine.send({ type: 'SYNC_ITEMS', items }), [machine, items])
  useEffect(() => machine.send({ type: 'SYNC_DISABLED', disabled }), [machine, disabled])
  useEffect(() => {
    if (value !== undefined) machine.send({ type: 'SYNC_VALUE', value })
  }, [machine, value])

  const triggerRef = useRef<HTMLButtonElement>(null)
  const positionerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLUListElement>(null)

  useLayoutEffect(() => {
    if (!state.open || !triggerRef.current || !positionerRef.current) return
    const stopPositioning = attachPositioner(triggerRef.current, positionerRef.current)
    const stopDismiss = trackDismissable(positionerRef.current, {
      exclude: [triggerRef.current],
      onDismiss: () => {
        machine.send({ type: 'CLOSE' })
        triggerRef.current?.focus()
      },
    })
    return () => {
      stopPositioning()
      stopDismiss()
    }
  }, [machine, state.open])

  useEffect(() => {
    if (!state.open || state.highlightedIndex < 0) return
    scrollIntoViewIfNeeded(document.getElementById(api.ids.item(state.highlightedIndex)), contentRef.current)
  }, [api.ids, state.open, state.highlightedIndex])

  return (
    <div {...api.rootProps}>
      {label && <label {...api.labelProps}>{label}</label>}

      <button ref={triggerRef} {...api.triggerProps}>
        <span {...api.valueProps}>{api.displayText}</span>
        <span {...api.indicatorProps} />
      </button>

      <div ref={positionerRef} {...api.positionerProps}>
        <ul ref={contentRef} {...api.contentProps}>
          {api.items.length === 0 && <li {...api.emptyProps}>No options</li>}
          {api.items.map((item, index) => (
            <li key={item.value} {...api.getItemProps(item, index)}>
              <span {...api.getItemTextProps()}>{item.label}</span>
              <span {...api.getItemIndicatorProps()} />
            </li>
          ))}
        </ul>
      </div>

      {name && <input {...api.hiddenInputProps} />}
    </div>
  )
}
