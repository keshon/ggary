import type { Dict, Normalizer } from '../../types'
import { selectAnatomy } from './select.anatomy'
import type { SelectEvent, SelectItem, SelectState } from './select.types'

export const selectIds = (id: string) => ({
  root: `${id}`,
  label: `${id}-label`,
  trigger: `${id}-trigger`,
  content: `${id}-content`,
  item: (index: number) => `${id}-item-${index}`,
})

/** A single printable character, not a named key like "ArrowDown" or "Tab". */
const isPrintable = (key: string) => key.length === 1 && key !== ' '

const PAGE_STEP = 10

export interface ConnectOptions {
  placeholder?: string
  /** Renders a hidden input so the value participates in native form submission. */
  name?: string
  form?: string
}

/**
 * The whole point of the architecture: ONE function turns machine state into
 * prop bags, and three adapters spread the result. Markup differs per framework;
 * behaviour, ARIA wiring and keyboard handling exist exactly once — here.
 */
export function connect<T = Dict>(
  state: SelectState,
  send: (event: SelectEvent) => void,
  normalize: Normalizer<T>,
  options: ConnectOptions = {}
) {
  const ids = selectIds(state.id)
  const { placeholder = 'Select…', name, form } = options

  const selectedItem = state.items.find((item) => item.value === state.value) ?? null
  const highlighted = state.highlightedIndex

  const onKeyDown = (event: KeyboardEvent) => {
    if (state.disabled) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        // Alt+Down opens without changing the value — native <select> contract.
        if (!state.open && event.altKey) send({ type: 'OPEN', focus: 'selected' })
        else send({ type: 'HIGHLIGHT_MOVE', step: 1 })
        return

      case 'ArrowUp':
        event.preventDefault()
        if (state.open && event.altKey) send({ type: 'CLOSE' })
        else send({ type: 'HIGHLIGHT_MOVE', step: -1 })
        return

      case 'PageDown':
        event.preventDefault()
        send({ type: 'HIGHLIGHT_MOVE', step: PAGE_STEP })
        return

      case 'PageUp':
        event.preventDefault()
        send({ type: 'HIGHLIGHT_MOVE', step: -PAGE_STEP })
        return

      case 'Home':
        event.preventDefault()
        send({ type: 'HIGHLIGHT_EDGE', edge: 'first' })
        return

      case 'End':
        event.preventDefault()
        send({ type: 'HIGHLIGHT_EDGE', edge: 'last' })
        return

      case 'Enter':
      case ' ':
        event.preventDefault()
        send(state.open ? { type: 'SELECT' } : { type: 'OPEN', focus: 'selected' })
        return

      case 'Escape':
        if (!state.open) return
        event.preventDefault()
        send({ type: 'CLOSE' })
        return

      case 'Tab':
        // Do NOT preventDefault: closing must not trap focus.
        if (state.open) send({ type: 'CLOSE' })
        return

      default:
        if (!isPrintable(event.key) || event.ctrlKey || event.metaKey || event.altKey) return
        event.preventDefault()
        send({ type: 'TYPE', char: event.key, now: Date.now() })
    }
  }

  return {
    // --- read model, for adapters that need to render text ------------------
    ids,
    open: state.open,
    value: state.value,
    selectedItem,
    highlightedIndex: highlighted,
    displayText: selectedItem?.label ?? placeholder,
    hasValue: selectedItem != null,
    items: state.items,

    // --- imperative escape hatch -------------------------------------------
    setValue: (value: string | null) => send({ type: 'SYNC_VALUE', value }),
    setOpen: (open: boolean) => send(open ? { type: 'OPEN' } : { type: 'CLOSE' }),
    clear: () => send({ type: 'CLEAR' }),

    // --- prop bags ----------------------------------------------------------
    rootProps: normalize({
      ...selectAnatomy.attrs('root'),
      id: ids.root,
      'data-state': state.open ? 'open' : 'closed',
      'data-disabled': state.disabled ? '' : undefined,
    }),

    labelProps: normalize({
      ...selectAnatomy.attrs('label'),
      id: ids.label,
      'data-disabled': state.disabled ? '' : undefined,
      onClick: () => {
        if (!state.disabled) document.getElementById(ids.trigger)?.focus()
      },
    }),

    /**
     * The select-only combobox pattern (WAI-ARIA APG): focus never leaves the
     * trigger, and `aria-activedescendant` points at the highlighted option.
     * Much less fragile than moving real focus into the listbox.
     */
    triggerProps: normalize({
      ...selectAnatomy.attrs('trigger'),
      id: ids.trigger,
      type: 'button',
      role: 'combobox',
      'aria-haspopup': 'listbox',
      'aria-expanded': state.open ? 'true' : 'false',
      'aria-controls': ids.content,
      'aria-labelledby': `${ids.label} ${ids.trigger}`,
      'aria-activedescendant': state.open && highlighted >= 0 ? ids.item(highlighted) : undefined,
      disabled: state.disabled || undefined,
      'data-state': state.open ? 'open' : 'closed',
      'data-disabled': state.disabled ? '' : undefined,
      'data-placeholder': selectedItem ? undefined : '',
      onClick: () => send({ type: 'TOGGLE' }),
      onKeyDown,
    }),

    valueProps: normalize({
      ...selectAnatomy.attrs('value'),
      'data-placeholder': selectedItem ? undefined : '',
    }),

    indicatorProps: normalize({
      ...selectAnatomy.attrs('indicator'),
      'aria-hidden': 'true',
      'data-state': state.open ? 'open' : 'closed',
    }),

    positionerProps: normalize({
      ...selectAnatomy.attrs('positioner'),
      'data-state': state.open ? 'open' : 'closed',
    }),

    contentProps: normalize({
      ...selectAnatomy.attrs('content'),
      id: ids.content,
      role: 'listbox',
      'aria-labelledby': ids.label,
      tabIndex: -1,
      'data-state': state.open ? 'open' : 'closed',
      // Keep focus on the trigger so aria-activedescendant stays authoritative.
      onPointerDown: (event: PointerEvent) => event.preventDefault(),
    }),

    getItemProps: (item: SelectItem, index: number) =>
      normalize({
        ...selectAnatomy.attrs('item'),
        id: ids.item(index),
        role: 'option',
        'aria-selected': item.value === state.value ? 'true' : 'false',
        'aria-disabled': item.disabled ? 'true' : undefined,
        'data-value': item.value,
        'data-highlighted': index === highlighted ? '' : undefined,
        'data-selected': item.value === state.value ? '' : undefined,
        'data-disabled': item.disabled ? '' : undefined,
        onClick: () => {
          if (item.disabled) return
          send({ type: 'SELECT', index })
        },
        onPointerMove: () => {
          if (item.disabled || index === highlighted) return
          send({ type: 'HIGHLIGHT', index })
        },
      }),

    getItemTextProps: () => normalize({ ...selectAnatomy.attrs('item-text') }),
    getItemIndicatorProps: () => normalize({ ...selectAnatomy.attrs('item-indicator'), 'aria-hidden': 'true' }),
    emptyProps: normalize({ ...selectAnatomy.attrs('empty') }),

    /**
     * Form participation. A hidden input is the cheap 90% answer: it submits with
     * the form and works identically in all three adapters. A hidden native
     * <select> would additionally give you constraint validation (`required`) —
     * worth upgrading to when you need it.
     */
    hiddenInputProps: normalize({
      type: 'hidden',
      name,
      form,
      value: state.value ?? '',
      readOnly: true,
    }),
  }
}

export type SelectApi<T = Dict> = ReturnType<typeof connect<T>>
