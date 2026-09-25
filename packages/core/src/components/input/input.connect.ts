import type { Dict, Normalizer } from '../../types'
import { mergeProps } from '../../utils/merge-props'
import { inputAnatomy } from './input.anatomy'
import type { InputProps, InputWords } from './input.types'

export interface InputConnectOptions {
  /** Called with the new value on every edit. */
  onValueChange?: (value: string) => void
  /**
   * The canonical control props of an enclosing Field (FieldApi.control). They
   * are MERGED, not spread over: both components add an input handler, and the
   * Field's ids win so its label and descriptions stay attached.
   */
  field?: Dict
  /** A password field's typing is shown; the adapter keeps it. */
  revealed?: boolean
  onRevealChange?: (revealed: boolean) => void
  words?: InputWords
}

/**
 * Hides a shown password when its form is sent: a password manager offers to
 * save what it sees in a password field, and one shown as text is not one.
 * The type goes back at once, before the browser reads the form.
 */
export function hideOnSubmit(input: HTMLInputElement | null, onHide: () => void): () => void {
  const form = input?.form
  if (!input || !form) return () => {}
  const hide = () => {
    if (input.type !== 'password') {
      input.type = 'password'
      onHide()
    }
  }
  form.addEventListener('submit', hide, true)
  return () => form.removeEventListener('submit', hide, true)
}

/**
 * No machine: the value lives in the native element, where every framework
 * already knows how to own it. Input contributes the attribute contract and the
 * value callback; the adapter decides controlled or uncontrolled.
 */
export function connect<T = Dict>(props: InputProps, normalize: Normalizer<T>, options: InputConnectOptions = {}) {
  const { type = 'text', size = 'md', name, placeholder, autoComplete, inputMode, disabled, readOnly, required, invalid, reveal } = props
  const { onValueChange, field, revealed = false, onRevealChange, words = {} } = options
  // A password field, unless told otherwise, can show what was typed.
  const canReveal = type === 'password' && reveal !== false
  const shown = canReveal && revealed

  const own: Dict = {
    ...inputAnatomy.attrs('root'),
    type: shown ? 'text' : type,
    'data-reveal': canReveal ? '' : undefined,
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
    canReveal,
    rootProps: normalize(mergeProps(own, field)),
    fieldProps: normalize({ ...inputAnatomy.attrs('field'), 'data-size': size }),
    /**
     * A toggle, named once and pressed or not — "Show password, pressed" —
     * rather than a name that changes under the reader's feet.
     */
    revealProps: normalize({
      ...inputAnatomy.attrs('reveal'),
      type: 'button',
      'aria-label': words.reveal ?? 'Show password',
      'aria-pressed': shown ? 'true' : 'false',
      'data-size': size,
      disabled: disabled || undefined,
      onClick: () => onRevealChange?.(!revealed),
    }),
    revealIconProps: normalize({ ...inputAnatomy.attrs('reveal-icon'), 'data-icon': shown ? 'eye-off' : 'eye', 'aria-hidden': 'true' }),
  }
}
