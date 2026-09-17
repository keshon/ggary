import type { Dict, Normalizer } from '../../types'
import { mergeProps } from '../../utils/merge-props'
import { numberFieldAnatomy as anatomy } from './number-field.anatomy'
import type { NumberFieldProps } from './number-field.types'

export interface NumberFieldConnectOptions {
  /** A number, or null when the field is empty or holds no number yet. */
  onValueChange?: (value: number | null) => void
  /** The canonical control props of an enclosing Field; its id wins. */
  field?: Dict
}

/** What a number input holds: its number, or null for empty and for text that is not a number yet. */
export function readNumber(input: HTMLInputElement): number | null {
  if (input.value === '') return null
  const value = Number(input.value)
  return Number.isFinite(value) ? value : null
}

/**
 * A native `input[type=number]`, the primitive of an inspector: the arrows step
 * it, the Page keys step it tenfold, touch keyboards open the digits, and the
 * form gets its value — none of it written here. The spin buttons are removed
 * by styling, not behaviour: in a dense row they took a third of the width.
 *
 * The axis letter is a drag handle (utils/scrub), not a <label>: as a label it
 * would become the field's whole accessible name, "X" instead of "Position X".
 * The value is never controlled through the element while it is edited —
 * adapters write it only when it differs from what the input already holds,
 * or "1." would be rewritten to "1" under the caret.
 */
export function connect<T = Dict>(props: NumberFieldProps, normalize: Normalizer<T>, options: NumberFieldConnectOptions = {}) {
  const { id, min, max, step = 1, name, label, axis, placeholder, size = 'md', disabled, readOnly, required, invalid } = props
  const { field, onValueChange } = options
  const isDisabled = Boolean(disabled || field?.disabled)
  const isReadOnly = Boolean(readOnly || field?.readOnly)
  const isInvalid = Boolean(invalid || field?.['aria-invalid'] === 'true')

  const state = {
    'data-size': size,
    'data-disabled': isDisabled ? '' : undefined,
    'data-readonly': isReadOnly ? '' : undefined,
    'data-invalid': isInvalid ? '' : undefined,
  }

  const own: Dict = {
    ...anatomy.attrs('input'),
    ...state,
    type: 'number',
    id: field?.id ?? props.inputId ?? `${id}-input`,
    name,
    min,
    max,
    step,
    placeholder,
    inputMode: 'decimal',
    'aria-label': field ? undefined : label,
    disabled: disabled || undefined,
    readOnly: readOnly || undefined,
    required: required || undefined,
    'aria-invalid': invalid ? 'true' : undefined,
    onInput: onValueChange ? (event: Event) => onValueChange(readNumber(event.currentTarget as HTMLInputElement)) : undefined,
  }

  return {
    showAxis: Boolean(axis),
    axis: axis ?? '',
    /** Whether the axis drags: not when the field cannot change. */
    scrubbable: !isDisabled && !isReadOnly,
    rootProps: normalize({ ...anatomy.attrs('root'), ...state }),
    axisProps: normalize({
      ...anatomy.attrs('axis'),
      ...state,
      'aria-hidden': 'true',
      'data-scrub': !isDisabled && !isReadOnly ? '' : undefined,
    }),
    inputProps: normalize(mergeProps(own, field)),
  }
}
