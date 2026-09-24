import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import {
  connect,
  createSelectMachine,
  type SelectItem,
} from '@ggary/core/select'
import { attachPopover, mergeProps, reactNormalizer, scrollIntoViewIfNeeded } from '@ggary/core'
import type { ControlSize } from '@ggary/core'
import { useFormReset } from '../../utils/use-form-reset'
import { useFormField } from '../form/Form'

export interface SelectProps {
  /** `sm`, `md` or `lg`, as Input's and Button's. Default `md`. */
  size?: ControlSize
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
  const { size, items, label, placeholder, value, defaultValue, disabled = false, name, onValueChange } = props

  const reactId = useId()
  const id = `gg-select-${reactId.replace(/:/g, '')}`

  // Callbacks change every render; the machine is created once. A ref is the
  // seam between the two.
  const callbacks = useRef<{ onValueChange?: typeof onValueChange; edited?: () => void }>({ onValueChange })
  callbacks.current.onValueChange = onValueChange

  const [machine] = useState(() =>
    createSelectMachine({
      id,
      items,
      value,
      defaultValue,
      disabled,
      onValueChange: (next, item) => {
        callbacks.current.onValueChange?.(next, item)
        callbacks.current.edited?.()
      },
    })
  )

  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const api = connect(state, machine.send, reactNormalizer, { placeholder, name, size })
  // Inside a Form, by name: the error its rules hold for this choice.
  const form = useFormField(name, api.ids.trigger, label)
  callbacks.current.edited = () => form.edited(document.getElementById(api.ids.trigger))

  // Props flow in as events. The machine never reads props directly.
  useEffect(() => machine.send({ type: 'SYNC_ITEMS', items }), [machine, items])
  useEffect(() => machine.send({ type: 'SYNC_DISABLED', disabled }), [machine, disabled])
  useEffect(() => {
    if (value !== undefined) machine.send({ type: 'SYNC_VALUE', value })
  }, [machine, value])

  const triggerRef = useRef<HTMLButtonElement>(null)
  useFormReset(triggerRef, () => {
    if (value === undefined) machine.send({ type: 'SYNC_VALUE', value: defaultValue ?? null })
  })
  const positionerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLUListElement>(null)

  useLayoutEffect(() => {
    if (!state.open || !triggerRef.current || !positionerRef.current) return
    // Focus stays on the trigger (aria-activedescendant), so no focus management.
    const popover = attachPopover(triggerRef.current, positionerRef.current, {
      sameWidth: true,
      gutter: 4,
      // Placement is asynchronous and shortens the list: keep the highlight in view after it.
      onPlaced: () => {
        const { highlightedIndex } = machine.getState()
        if (highlightedIndex >= 0) scrollIntoViewIfNeeded(document.getElementById(api.ids.item(highlightedIndex)), contentRef.current)
      },
      onDismiss: () => {
        machine.send({ type: 'CLOSE' })
        triggerRef.current?.focus()
      },
    })
    return () => popover.destroy()
  }, [machine, state.open])

  useEffect(() => {
    if (!state.open || state.highlightedIndex < 0) return
    scrollIntoViewIfNeeded(document.getElementById(api.ids.item(state.highlightedIndex)), contentRef.current)
  }, [api.ids, state.open, state.highlightedIndex])

  return (
    <div {...api.rootProps}>
      {label && <label {...api.labelProps}>{label}</label>}

      <button ref={triggerRef} {...mergeProps(api.triggerProps, form.field.controlProps)}>
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

      <span {...form.field.errorProps}>{form.error}</span>
      {name && <input {...api.hiddenInputProps} />}
    </div>
  )
}
