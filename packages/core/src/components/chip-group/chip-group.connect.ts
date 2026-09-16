import type { Dict, Normalizer } from '../../types'
import { chipAttrs, chipRemoveAttrs, chipRemoveIconAttrs } from '../chip/chip.connect'
import type { ChipEmphasis, ChipSize } from '../chip/chip.types'
import { chipGroupAnatomy } from './chip-group.anatomy'
import type { ChipGroupEvent, ChipGroupState, ChipItem } from './chip-group.types'

export const chipGroupIds = (id: string) => ({
  root: id,
  label: `${id}-label`,
  list: `${id}-list`,
  chip: (index: number) => `${id}-chip-${index}`,
})

const isPrintable = (key: string) => key.length === 1 && key !== ' '

export interface ConnectOptions {
  label?: string
  emphasis?: ChipEmphasis
  size?: ChipSize
  /** Rendered as hidden inputs so the selection participates in form submission. */
  name?: string
  form?: string
}

export function connect<T = Dict>(
  state: ChipGroupState,
  send: (event: ChipGroupEvent) => void,
  normalize: Normalizer<T>,
  options: ConnectOptions = {}
) {
  const ids = chipGroupIds(state.id)
  const { label, emphasis = 'low', size = 'md', name, form } = options
  const horizontal = state.orientation === 'horizontal'

  const forward = horizontal ? 'ArrowRight' : 'ArrowDown'
  const backward = horizontal ? 'ArrowLeft' : 'ArrowUp'

  const onKeyDown = (event: KeyboardEvent) => {
    if (state.disabled) return

    // Space and Enter are deliberately absent: the chip is a real <button>, so
    // the browser already turns them into a click, which TOGGLEs. Handling them
    // here as well would toggle twice.
    switch (event.key) {
      case forward:
        event.preventDefault()
        return send({ type: 'FOCUS_MOVE', step: 1 })
      case backward:
        event.preventDefault()
        return send({ type: 'FOCUS_MOVE', step: -1 })
      case 'Home':
        event.preventDefault()
        return send({ type: 'FOCUS_EDGE', edge: 'first' })
      case 'End':
        event.preventDefault()
        return send({ type: 'FOCUS_EDGE', edge: 'last' })
      case 'Delete':
      case 'Backspace':
        event.preventDefault()
        return send({ type: 'REMOVE' })
      default:
        if (!isPrintable(event.key) || event.ctrlKey || event.metaKey || event.altKey) return
        event.preventDefault()
        send({ type: 'TYPE', char: event.key, now: Date.now() })
    }
  }

  return {
    ids,
    selection: state.selection,
    selectedItems: state.items.filter((item) => state.selection.includes(item.value)),
    focusedIndex: state.focus.index,
    /** Adapters focus a chip only when this changes, never on mount or re-render. */
    focusNonce: state.focus.nonce,
    items: state.items,
    isSelected: (item: ChipItem) => state.selection.includes(item.value),

    clear: () => send({ type: 'SYNC_SELECTION', selection: [] }),

    rootProps: normalize({
      ...chipGroupAnatomy.attrs('root'),
      id: ids.root,
      'data-orientation': state.orientation,
      'data-disabled': state.disabled ? '' : undefined,
    }),

    labelProps: normalize({
      ...chipGroupAnatomy.attrs('label'),
      id: ids.label,
      'data-disabled': state.disabled ? '' : undefined,
    }),

    /**
     * `toolbar` is the honest role here: a group of buttons the user arrows
     * between. A strict APG `radiogroup` would be right for exclusive choice
     * that cannot be undone, but filter chips deselect on re-click.
     */
    listProps: normalize({
      ...chipGroupAnatomy.attrs('list'),
      id: ids.list,
      role: 'toolbar',
      'aria-orientation': state.orientation,
      'aria-labelledby': label ? ids.label : undefined,
      'data-orientation': state.orientation,
    }),

    getChipProps: (item: ChipItem, index: number) => {
      const disabled = state.disabled || !!item.disabled
      const removable = (item.removable ?? state.removable) && !disabled
      return normalize({
        ...chipAttrs({
          emphasis,
          size,
          selected: state.selection.includes(item.value),
          disabled,
          removable,
        }),
        id: ids.chip(index),
        type: 'button',
        'aria-pressed': state.selection.includes(item.value) ? 'true' : 'false',
        'aria-keyshortcuts': removable ? 'Delete' : undefined,
        disabled: disabled || undefined,
        // Roving tabindex: exactly one chip is in the tab order, so Tab enters
        // and leaves the group rather than walking every chip.
        tabIndex: index === state.focus.index ? 0 : -1,
        'data-focused': index === state.focus.index ? '' : undefined,
        onClick: () => send({ type: 'TOGGLE', index }),
        onFocus: () => send({ type: 'FOCUS', index }),
        onKeyDown,
      })
    },

    getChipLabelProps: () => normalize({ 'data-scope': 'chip', 'data-part': 'label' }),

    getChipRemoveProps: (item: ChipItem, index: number) =>
      normalize(
        chipRemoveAttrs(
          state.disabled || item.disabled ? undefined : () => send({ type: 'REMOVE', index })
        )
      ),

    getChipRemoveIconProps: () => normalize(chipRemoveIconAttrs()),

    emptyProps: normalize({ ...chipGroupAnatomy.attrs('empty') }),

    /** One hidden input per selected value — how a multi-value field submits. */
    getHiddenInputProps: (value: string) =>
      normalize({ type: 'hidden', name, form, value, readOnly: true }),
    hasName: !!name,
  }
}

export type ChipGroupApi<T = Dict> = ReturnType<typeof connect<T>>
