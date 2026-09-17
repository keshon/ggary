import type { Dict, Normalizer } from '../../types'
import { segmentedControlAnatomy as anatomy } from './segmented-control.anatomy'
import type { SegmentedControlProps, SegmentedItem } from './segmented-control.types'

export interface SegmentedControlConnectOptions {
  onValueChange?: (value: string) => void
  /** The native radios own their checked state (enhanced server markup). */
  nativeChecked?: boolean
}

/**
 * One choice among equal options, always exactly one — a radio group drawn as
 * a row of segments. So it IS native radios sharing a name: one tab stop, the
 * arrow keys move and select, the value submits with a form, and none of it is
 * code here. Instrument builds the same control from buttons with
 * role="radio" and a script for the roving tabindex; the radios make the
 * script unnecessary.
 *
 * The radio covers its whole segment, transparent: a press anywhere on the
 * segment lands on the input itself, and the focus ring is drawn by the
 * segment through :has(:focus-visible).
 */
export function connect<T = Dict>(props: SegmentedControlProps, normalize: Normalizer<T>, options: SegmentedControlConnectOptions = {}) {
  const { id, items, label, value = null, size = 'md', disabled, required, fullWidth } = props
  const name = props.name || id

  const getItemProps = (item: SegmentedItem, index: number) => {
    const checked = item.value === value
    const itemDisabled = Boolean(disabled || item.disabled)
    const state = {
      'data-state': checked ? 'checked' : 'unchecked',
      'data-disabled': itemDisabled ? '' : undefined,
    }
    return {
      itemProps: normalize({ ...anatomy.attrs('item'), ...state }),
      inputProps: normalize({
        ...anatomy.attrs('input'),
        ...state,
        type: 'radio',
        id: `${id}-item-${index}`,
        name,
        value: item.value,
        checked: options.nativeChecked ? undefined : checked,
        disabled: itemDisabled || undefined,
        required: required || undefined,
        // A radio reports only when it BECOMES checked, so every call is a choice.
        onInput: options.onValueChange ? () => options.onValueChange!(item.value) : undefined,
      }),
      textProps: normalize({ ...anatomy.attrs('text'), ...state }),
    }
  }

  return {
    name,
    value,
    items,
    getItemProps,
    rootProps: normalize({
      ...anatomy.attrs('root'),
      id,
      role: 'radiogroup',
      'aria-label': label,
      'aria-required': required ? 'true' : undefined,
      'aria-disabled': disabled ? 'true' : undefined,
      'data-size': size,
      'data-disabled': disabled ? '' : undefined,
      'data-full-width': fullWidth ? '' : undefined,
    }),
  }
}
