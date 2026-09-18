import type { IconName } from '@ggary/icons'
import type { Dict, Normalizer } from '../../types'
import { comboboxAnatomy as anatomy } from './combobox.anatomy'
import type { ComboboxEvent, ComboboxItem, ComboboxState } from './combobox.types'

export const comboboxIds = (id: string) => ({
  root: id,
  label: `${id}-label`,
  input: `${id}-input`,
  content: `${id}-content`,
  status: `${id}-status`,
  item: (index: number) => `${id}-item-${index}`,
})

export interface ComboboxWords {
  locale?: string
  placeholder?: string
  /** Said when nothing matches. */
  empty?: string
  searching?: string
  /** "12 results", for the live status; receives the count. */
  results?: (count: number) => string
  /** "Showing 50 of 1,284 — type to narrow". */
  more?: (shown: number, total: number) => string
  /** "Could not search: …"; receives the reason. */
  failed?: (message: string) => string
  clear?: string
  /** "Remove Daria M."; receives the label. */
  remove?: (label: string) => string
}

export interface ComboboxConnectOptions extends ComboboxWords {
  /** Renders hidden inputs, one per value, so the choice submits with its form. */
  name?: string
  form?: string
}

const PAGE_STEP = 10

/**
 * A text field with a list of options under it — the editable combobox of the
 * ARIA practices, with list autocomplete. The field keeps the focus the whole
 * time, and `aria-activedescendant` names the highlighted option, so typing
 * and choosing never fight over where the focus is. A press on the list is
 * cancelled for the same reason: the field would lose the focus to it.
 *
 * Home and End stay the field's — they move the caret in what was typed.
 * Escape closes an open list, and on a closed one empties the field. Leaving
 * without choosing puts the field back to the chosen value's label.
 */
export function connect<T = Dict>(state: ComboboxState, send: (event: ComboboxEvent) => void, normalize: Normalizer<T>, options: ComboboxConnectOptions = {}) {
  const ids = comboboxIds(state.id)
  const format = (count: number) => count.toLocaleString(options.locale)
  const selectedItems = state.selected
  const single = !state.multiple ? (selectedItems[0] ?? null) : null
  const highlighted = state.highlightedIndex
  const inputValue = state.typing || state.multiple ? state.query : (single?.label ?? '')
  const shown = state.items.length
  const loading = state.status === 'loading'

  const statusText =
    state.status === 'error'
      ? (options.failed ?? ((message: string) => `Could not search: ${message}`))(state.error ?? '')
      : !state.open
        ? ''
        : loading && shown === 0
          ? (options.searching ?? 'Searching…')
          : shown === 0
            ? (options.empty ?? 'No matches')
            : (options.results ?? ((count: number) => `${format(count)} ${count === 1 ? 'result' : 'results'}`))(state.total)

  const onKeyDown = (event: KeyboardEvent) => {
    if (state.disabled || event.isComposing) return
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        // Alt+Down opens without moving, as a native list does.
        if (!state.open) send(event.altKey ? { type: 'OPEN' } : { type: 'HIGHLIGHT_MOVE', step: 1 })
        else send({ type: 'HIGHLIGHT_MOVE', step: 1 })
        return
      case 'ArrowUp':
        event.preventDefault()
        if (state.open && event.altKey) send({ type: 'CLOSE' })
        else send({ type: 'HIGHLIGHT_MOVE', step: -1 })
        return
      case 'PageDown':
      case 'PageUp':
        if (!state.open) return
        event.preventDefault()
        send({ type: 'HIGHLIGHT_MOVE', step: event.key === 'PageDown' ? PAGE_STEP : -PAGE_STEP })
        return
      case 'Enter':
        if (!state.open || highlighted < 0) return
        // A form is not submitted by choosing an option.
        event.preventDefault()
        send({ type: 'SELECT' })
        return
      case 'Escape':
        if (state.open) {
          event.preventDefault()
          // An open list is the dialog's Escape, not the dialog around it.
          event.stopPropagation()
          send({ type: 'CLOSE' })
        } else if (state.query !== '' || (!state.multiple && state.value.length > 0)) {
          event.preventDefault()
          send({ type: 'CLEAR' })
        }
        return
      case 'Backspace':
        if (state.multiple && state.query === '' && state.value.length > 0) {
          event.preventDefault()
          send({ type: 'REMOVE_LAST' })
        }
        return
      case 'Tab':
        // Not prevented: the focus moves on, and the list goes with it.
        if (state.open) send({ type: 'CLOSE' })
        return
    }
  }

  return {
    ids,
    open: state.open,
    value: state.value,
    selectedItems,
    items: state.items,
    highlightedIndex: highlighted,
    inputValue,
    loading,
    statusText,
    /** Options beyond the ones drawn: "Showing 50 of 1,284 — type to narrow". */
    moreText: state.total > shown && shown > 0 ? (options.more ?? ((a: number, b: number) => `Showing ${format(a)} of ${format(b)} — type to narrow`))(shown, state.total) : '',
    emptyText: state.status === 'error' ? statusText : loading ? (options.searching ?? 'Searching…') : (options.empty ?? 'No matches'),
    clearable: state.value.length > 0 || state.query !== '',
    clear: () => send({ type: 'CLEAR' }),
    setValue: (value: string | string[] | null, items?: ComboboxItem[]) => send({ type: 'SYNC_VALUE', value, items }),

    rootProps: normalize({
      ...anatomy.attrs('root'),
      id: ids.root,
      'data-state': state.open ? 'open' : 'closed',
      'data-multiple': state.multiple ? '' : undefined,
      'data-disabled': state.disabled ? '' : undefined,
    }),
    labelProps: normalize({ ...anatomy.attrs('label'), id: ids.label, htmlFor: ids.input, 'data-disabled': state.disabled ? '' : undefined }),
    /** The box that looks like a field: chips, the input, the clear and the chevron. */
    controlProps: normalize({
      ...anatomy.attrs('control'),
      'data-state': state.open ? 'open' : 'closed',
      'data-disabled': state.disabled ? '' : undefined,
      // A press on the box, beside the input, is a press on the input.
      onPointerDown: (event: PointerEvent) => {
        const target = event.target as HTMLElement
        if (target.closest('input, button')) return
        event.preventDefault()
        ;(event.currentTarget as HTMLElement).ownerDocument.getElementById(ids.input)?.focus()
        if (!state.open) send({ type: 'OPEN' })
      },
    }),
    getChipProps: (item: ComboboxItem) => ({
      chipProps: normalize({ ...anatomy.attrs('chip'), 'data-value': item.value }),
      chipTextProps: normalize({ ...anatomy.attrs('chip-text') }),
      // Not a tab stop: the field is the one stop, and Backspace removes from its end.
      removeProps: normalize({
        ...anatomy.attrs('chip-remove'),
        type: 'button',
        tabIndex: -1,
        'aria-label': (options.remove ?? ((label: string) => `Remove ${label}`))(item.label),
        disabled: state.disabled || undefined,
        onPointerDown: (event: PointerEvent) => event.preventDefault(),
        onClick: () => send({ type: 'REMOVE', value: item.value }),
      }),
      removeIconProps: normalize({ ...anatomy.attrs('chip-remove-icon'), 'aria-hidden': 'true', 'data-icon': 'close' satisfies IconName }),
    }),
    inputProps: normalize({
      ...anatomy.attrs('input'),
      id: ids.input,
      type: 'text',
      role: 'combobox',
      autoComplete: 'off',
      spellCheck: false,
      'aria-autocomplete': 'list',
      'aria-expanded': state.open ? 'true' : 'false',
      'aria-controls': ids.content,
      'aria-activedescendant': state.open && highlighted >= 0 ? ids.item(highlighted) : undefined,
      'aria-describedby': ids.status,
      'aria-busy': loading ? 'true' : undefined,
      placeholder: state.multiple && state.value.length > 0 ? undefined : options.placeholder,
      value: inputValue,
      disabled: state.disabled || undefined,
      onInput: (event: Event) => send({ type: 'INPUT', text: (event.currentTarget as HTMLInputElement).value }),
      onKeyDown,
      onClick: () => {
        if (!state.open) send({ type: 'OPEN' })
      },
      // Leaving puts the field back to what was chosen.
      onBlur: () => send({ type: 'CLOSE' }),
    }),
    clearProps: normalize({
      ...anatomy.attrs('clear'),
      type: 'button',
      tabIndex: -1,
      'aria-label': options.clear ?? 'Clear',
      hidden: state.value.length > 0 || state.query !== '' ? undefined : true,
      disabled: state.disabled || undefined,
      onPointerDown: (event: PointerEvent) => event.preventDefault(),
      onClick: (event: MouseEvent) => {
        send({ type: 'CLEAR' })
        ;(event.currentTarget as HTMLElement).ownerDocument.getElementById(ids.input)?.focus()
      },
    }),
    clearIconProps: normalize({ ...anatomy.attrs('clear-icon'), 'aria-hidden': 'true', 'data-icon': 'close' satisfies IconName }),
    /** The chevron: opens and closes the list. The field stays the one tab stop. */
    triggerProps: normalize({
      ...anatomy.attrs('trigger'),
      type: 'button',
      tabIndex: -1,
      'aria-hidden': 'true',
      disabled: state.disabled || undefined,
      'data-state': state.open ? 'open' : 'closed',
      onPointerDown: (event: PointerEvent) => event.preventDefault(),
      onClick: (event: MouseEvent) => {
        send({ type: 'TOGGLE' })
        ;(event.currentTarget as HTMLElement).ownerDocument.getElementById(ids.input)?.focus()
      },
    }),
    triggerIconProps: normalize({ ...anatomy.attrs('trigger-icon'), 'aria-hidden': 'true', 'data-icon': 'chevron-down' satisfies IconName }),
    positionerProps: normalize({ ...anatomy.attrs('positioner'), popover: 'manual', 'data-state': state.open ? 'open' : 'closed' }),
    contentProps: normalize({
      ...anatomy.attrs('content'),
      id: ids.content,
      role: 'listbox',
      'aria-labelledby': ids.label,
      'aria-multiselectable': state.multiple ? 'true' : undefined,
      'aria-busy': loading ? 'true' : undefined,
      tabIndex: -1,
      'data-state': state.open ? 'open' : 'closed',
      // The previous answer, while the next is on its way.
      'data-stale': loading && shown > 0 ? '' : undefined,
      // The field keeps the focus.
      onPointerDown: (event: PointerEvent) => event.preventDefault(),
    }),
    getItemProps: (item: ComboboxItem, index: number) => {
      const selected = state.value.includes(item.value)
      return normalize({
        ...anatomy.attrs('item'),
        id: ids.item(index),
        role: 'option',
        'aria-selected': selected ? 'true' : 'false',
        'aria-disabled': item.disabled ? 'true' : undefined,
        'data-value': item.value,
        'data-highlighted': index === highlighted ? '' : undefined,
        'data-selected': selected ? '' : undefined,
        'data-disabled': item.disabled ? '' : undefined,
        onClick: () => {
          if (!item.disabled) send({ type: 'SELECT', index })
        },
        onPointerMove: () => {
          if (!item.disabled && index !== highlighted) send({ type: 'HIGHLIGHT', index })
        },
      })
    },
    itemTextProps: normalize({ ...anatomy.attrs('item-text') }),
    itemDescriptionProps: normalize({ ...anatomy.attrs('item-description') }),
    itemIndicatorProps: normalize({ ...anatomy.attrs('item-indicator'), 'aria-hidden': 'true', 'data-icon': 'check' satisfies IconName }),
    emptyProps: normalize({ ...anatomy.attrs('empty'), 'data-status': state.status }),
    moreProps: normalize({ ...anatomy.attrs('more'), 'aria-hidden': 'true' }),
    /** Spoken, not shown: how many matched, that it is searching, that it failed. */
    statusProps: normalize({ ...anatomy.attrs('status'), id: ids.status, role: 'status', 'aria-live': 'polite' }),
    getHiddenInputProps: (value: string) => normalize({ type: 'hidden', name: options.name, form: options.form, value }),
  }
}

export type ComboboxApi<T = Dict> = ReturnType<typeof connect<T>>
