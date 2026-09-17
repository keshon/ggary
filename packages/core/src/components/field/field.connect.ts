import type { Dict, Normalizer } from '../../types'
import { fieldAnatomy } from './field.anatomy'
import type { FieldEvent, FieldState } from './field.types'

export const fieldIds = (id: string) => ({
  root: id,
  label: `${id}-label`,
  control: `${id}-control`,
  hint: `${id}-hint`,
  error: `${id}-error`,
})

export interface FieldConnectOptions {
  /** Whether a hint is rendered. Its text is the adapter's to render. */
  hint?: boolean
  /**
   * The message to show when the field is invalid. Absent, the control's own
   * native validationMessage is used for native errors.
   */
  error?: string
}

/** Constraint validity off whatever element the event came from. */
const validityOf = (event: Event) => {
  const el = event.currentTarget as HTMLInputElement | null
  return { valid: el?.validity?.valid ?? true, message: el?.validationMessage ?? '' }
}

/**
 * The hint and the error share ONE slot: when an error shows, it replaces the
 * hint instead of pushing the form down, and `aria-describedby` points at
 * whichever is visible. Neither part is removed from the DOM — both are
 * `hidden` — so ids never dangle and nodes do not churn as validity flips.
 */
export function connect<T = Dict>(
  state: FieldState,
  send: (event: FieldEvent) => void,
  normalize: Normalizer<T>,
  options: FieldConnectOptions = {}
) {
  const ids = fieldIds(state.id)
  const nativeInvalid = state.touched && !state.valid
  const invalid = state.invalid || nativeInvalid
  const errorText = invalid ? (options.error ?? (nativeInvalid ? state.message : '')) : ''
  const showError = errorText !== ''
  const showHint = Boolean(options.hint) && !showError

  const stateAttrs = {
    'data-invalid': invalid ? '' : undefined,
    'data-disabled': state.disabled ? '' : undefined,
    'data-readonly': state.readOnly ? '' : undefined,
    'data-required': state.required ? '' : undefined,
  }

  /**
   * Canonical, NOT normalized: these props are merged with the control's own
   * (see mergeProps) and normalized once, by the control's connect.
   */
  const control: Dict = {
    id: ids.control,
    required: state.required || undefined,
    disabled: state.disabled || undefined,
    readOnly: state.readOnly || undefined,
    'aria-invalid': invalid ? 'true' : undefined,
    'aria-describedby': [showHint && ids.hint, showError && ids.error].filter(Boolean).join(' ') || undefined,
    'data-invalid': invalid ? '' : undefined,
    onBlur: (event: Event) => send({ type: 'BLUR', ...validityOf(event) }),
    onInput: (event: Event) => send({ type: 'INPUT', ...validityOf(event) }),
    // A submit attempt reports every invalid control at once. The browser's
    // own message bubble is left alone: suppressing it would also suppress the
    // browser focusing the first invalid control.
    onInvalid: (event: Event) => send({ type: 'INVALID', message: validityOf(event).message }),
  }

  return {
    ids,
    invalid,
    errorText,
    showError,
    showHint,
    control,
    reset: () => send({ type: 'RESET' }),

    rootProps: normalize({ ...fieldAnatomy.attrs('root'), id: ids.root, ...stateAttrs }),

    /**
     * The required marker is NOT markup. `required` on the control already
     * tells assistive tech; the visible mark is decoration, so a theme draws it
     * from `data-required` — an asterisk, "(required)", or nothing at all.
     */
    labelProps: normalize({ ...fieldAnatomy.attrs('label'), id: ids.label, for: ids.control, ...stateAttrs }),

    hintProps: normalize({ ...fieldAnatomy.attrs('hint'), id: ids.hint, hidden: !showHint || undefined }),

    errorProps: normalize({ ...fieldAnatomy.attrs('error'), id: ids.error, hidden: !showError || undefined }),
  }
}

export type FieldApi<T = Dict> = ReturnType<typeof connect<T>>
