import type { Dict, Normalizer } from '../../types'
import { mergeProps } from '../../utils/merge-props'
import { inputAnatomy } from './input.anatomy'
import type { InputProps } from './input.types'

export interface InputConnectOptions {
  /** Called with the new value on every edit. */
  onValueChange?: (value: string) => void
  /**
   * The canonical control props of an enclosing Field (FieldApi.control). They
   * are MERGED, not spread over: both components add an input handler, and the
   * Field's ids win so its label and descriptions stay attached.
   */
  field?: Dict
}

/**
 * No machine: the value lives in the native element, where every framework
 * already knows how to own it. Input contributes the attribute contract and the
 * value callback; the adapter decides controlled or uncontrolled.
 */
export function connect<T = Dict>(props: InputProps, normalize: Normalizer<T>, options: InputConnectOptions = {}) {
  const { type = 'text', size = 'md', name, placeholder, autoComplete, inputMode, disabled, readOnly, required, invalid } = props
  const { onValueChange, field } = options

  const own: Dict = {
    ...inputAnatomy.attrs('root'),
    type,
    name,
    placeholder,
    autoComplete,
    inputMode,
    disabled: disabled || undefined,
    readOnly: readOnly || undefined,
    required: required || undefined,
    'aria-invalid': invalid ? 'true' : undefined,
    'data-size': size,
    'data-invalid': invalid ? '' : undefined,
    // `onInput`, the canonical key for "the value changed". The React
    // normalizer turns it into `onChange`, which is what React calls the same
    // event and what its controlled inputs require.
    onInput: onValueChange
      ? (event: Event) => onValueChange((event.currentTarget as HTMLInputElement).value)
      : undefined,
  }

  return {
    rootProps: normalize(mergeProps(own, field)),
  }
}
