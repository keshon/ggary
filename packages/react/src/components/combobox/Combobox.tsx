import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import {
  attachComboboxSource,
  connect,
  createComboboxMachine,
  type ComboboxItem,
  type ComboboxLoad,
  type ComboboxWords,
} from '@ggary/core/combobox'
import { attachPopover, reactNormalizer, scrollIntoViewIfNeeded } from '@ggary/core'
import { useFormReset } from '../../utils/use-form-reset'

export interface ComboboxProps {
  label?: string
  /** The options, filtered in the page as the person types. */
  items?: ComboboxItem[]
  /** Or a server that answers a query. Takes precedence over `items`. */
  load?: ComboboxLoad
  /** How long the typing pauses before `load` is asked, in ms. Default 200. */
  debounce?: number
  /** Fewer characters ask nothing. Default 0: an empty field shows suggestions. */
  minLength?: number
  /** Several values, as chips in the field. */
  multiple?: boolean
  /** Controlled. A single combobox takes a string; omit and use `defaultValue` for uncontrolled. */
  value?: string | string[] | null
  defaultValue?: string | string[] | null
  /** The chosen items' labels, when `load` knows them and `items` does not. */
  selectedItems?: ComboboxItem[]
  onValueChange?: (value: string[], items: ComboboxItem[]) => void
  /**
   * Typed text that matches no option can be created: "Create …" ends the
   * list. Return the new option (or a promise of it) and it is chosen; add it
   * to `items` to keep it. A rejection says why.
   */
  onCreate?: (text: string) => ComboboxItem | void | Promise<ComboboxItem | void>
  placeholder?: string
  disabled?: boolean
  /** How many options are drawn at once. Default 50. */
  limit?: number
  name?: string
  words?: ComboboxWords
}

/** A text field with a list of options: type to narrow it, arrows and Enter to choose. */
export function Combobox(props: ComboboxProps) {
  const {
    label, items, load, debounce, minLength, multiple = false, value, defaultValue, selectedItems, onValueChange, onCreate,
    placeholder, disabled = false, limit, name, words,
  } = props
  const id = `gg-combobox-${useId().replace(/:/g, '')}`
  const callbacks = useRef({ onValueChange, load, onCreate })
  callbacks.current = { onValueChange, load, onCreate }

  const [machine] = useState(() =>
    createComboboxMachine({
      id,
      items: load ? undefined : items,
      value,
      defaultValue,
      selectedItems,
      multiple,
      disabled,
      limit,
      creatable: onCreate !== undefined,
      onValueChange: (next, chosen) => callbacks.current.onValueChange?.(next, chosen),
      onCreate: (text) => callbacks.current.onCreate?.(text),
    })
  )
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const api = connect(state, machine.send, reactNormalizer, { ...words, placeholder: placeholder ?? words?.placeholder, name })

  useEffect(() => {
    if (!load && items) machine.send({ type: 'SYNC_SOURCE', items })
  }, [machine, items, load])
  const creatable = onCreate !== undefined
  useEffect(() => machine.send({ type: 'SYNC_OPTIONS', multiple, disabled, limit, creatable }), [machine, multiple, disabled, limit, creatable])
  useEffect(() => {
    if (value !== undefined) machine.send({ type: 'SYNC_VALUE', value, items: selectedItems })
  }, [machine, value, selectedItems])
  const hasLoad = Boolean(load)
  useEffect(() => {
    if (!hasLoad) return
    return attachComboboxSource(machine, (query, signal) => callbacks.current.load!(query, signal), { debounce, minLength })
  }, [machine, hasLoad, debounce, minLength])

  const inputRef = useRef<HTMLInputElement>(null)
  const controlRef = useRef<HTMLDivElement>(null)
  const positionerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLUListElement>(null)
  useFormReset(inputRef, () => {
    if (value === undefined) machine.send({ type: 'SYNC_VALUE', value: defaultValue ?? null })
  })

  useLayoutEffect(() => {
    if (!state.open || !controlRef.current || !positionerRef.current) return
    // The focus stays in the field: no focus management, only placement and dismissal.
    const popover = attachPopover(controlRef.current, positionerRef.current, {
      sameWidth: true,
      gutter: 4,
      onDismiss: () => machine.send({ type: 'CLOSE' }),
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
      <div ref={controlRef} {...api.controlProps}>
        {multiple &&
          api.selectedItems.map((item) => {
            const chip = api.getChipProps(item)
            return (
              <span key={item.value} {...chip.chipProps}>
                <span {...chip.chipTextProps}>{item.label}</span>
                <button {...chip.removeProps}>
                  <span {...chip.removeIconProps} />
                </button>
              </span>
            )
          })}
        <input ref={inputRef} {...api.inputProps} />
        <button {...api.clearProps}>
          <span {...api.clearIconProps} />
        </button>
        <button {...api.triggerProps}>
          <span {...api.triggerIconProps} />
        </button>
      </div>
      <div ref={positionerRef} {...api.positionerProps}>
        <ul ref={contentRef} {...api.contentProps}>
          {api.items.length === 0 && <li {...api.emptyProps}>{api.emptyText}</li>}
          {api.items.map((item, index) => (
            <li key={item.value} {...api.getItemProps(item, index)}>
              <span {...api.itemTextProps}>{api.labelOf(item)}</span>
              {item.description && <span {...api.itemDescriptionProps}>{item.description}</span>}
              <span {...api.itemIndicatorProps} />
            </li>
          ))}
          {api.moreText && <li {...api.moreProps}>{api.moreText}</li>}
        </ul>
      </div>
      <span {...api.statusProps}>{api.statusText}</span>
      {name && api.value.map((entry) => <input key={entry} {...api.getHiddenInputProps(entry)} />)}
    </div>
  )
}
