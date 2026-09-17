import type { Dict, Normalizer } from '../../types'
import { groupValidity, type GroupContext } from '../../utils/group'
import type { FieldEvent, FieldState } from '../field/field.types'
import { fieldsetAnatomy } from './fieldset.anatomy'

export const fieldsetIds = (id: string) => ({
  root: id,
  legend: `${id}-legend`,
  hint: `${id}-hint`,
  error: `${id}-error`,
})

export interface FieldsetConnectOptions {
  legend?: boolean
  hint?: boolean
  /** Shown when the group is invalid. Absent, the first failing control's own message is used. */
  error?: string
}

/**
 * A native <fieldset> and <legend>: a group of controls with one name, one
 * hint-or-error slot, and Field's validation timing for the group as a whole.
 * The machine is Field's — the rules are the same, only what "the control" is
 * differs:
 *
 *   - the group is touched when focus LEAVES it, not when it moves between its
 *     own options (a radio group is walked with the arrow keys);
 *   - a submit attempt is heard by capturing `invalid`, which does not bubble;
 *   - validity is every control's, read from `validity` (see utils/group).
 *
 * `disabled` is the native attribute, so every control inside is disabled by
 * the browser too — including ones no component of the kit rendered.
 */
export function connect<T = Dict>(
  state: FieldState,
  send: (event: FieldEvent) => void,
  normalize: Normalizer<T>,
  options: FieldsetConnectOptions = {}
) {
  const ids = fieldsetIds(state.id)
  const nativeInvalid = state.touched && !state.valid
  const invalid = state.invalid || nativeInvalid
  const errorText = invalid ? (options.error ?? (nativeInvalid ? state.message : '')) : ''
  const showError = errorText !== ''
  const showHint = Boolean(options.hint) && !showError

  const stateAttrs = {
    'data-invalid': invalid ? '' : undefined,
    'data-required': state.required ? '' : undefined,
    'data-disabled': state.disabled ? '' : undefined,
  }

  const group: GroupContext = { invalid, required: state.required, disabled: state.disabled }

  return {
    ids,
    invalid,
    errorText,
    showError,
    showHint,
    group,
    reset: () => send({ type: 'RESET' }),

    rootProps: normalize({
      ...fieldsetAnatomy.attrs('root'),
      id: ids.root,
      disabled: state.disabled || undefined,
      'aria-describedby': [showHint && ids.hint, showError && ids.error].filter(Boolean).join(' ') || undefined,
      ...stateAttrs,
      onFocusOut: (event: FocusEvent) => {
        const root = event.currentTarget as Element
        if (root.contains(event.relatedTarget as Node | null)) return
        send({ type: 'BLUR', ...groupValidity(root) })
      },
      onInput: (event: Event) => send({ type: 'INPUT', ...groupValidity(event.currentTarget as Element) }),
      onInvalidCapture: (event: Event) =>
        send({ type: 'INVALID', message: groupValidity(event.currentTarget as Element).message }),
    }),
    legendProps: normalize({ ...fieldsetAnatomy.attrs('legend'), id: ids.legend, ...stateAttrs }),
    contentProps: normalize({ ...fieldsetAnatomy.attrs('content') }),
    hintProps: normalize({ ...fieldsetAnatomy.attrs('hint'), id: ids.hint, hidden: !showHint || undefined }),
    errorProps: normalize({ ...fieldsetAnatomy.attrs('error'), id: ids.error, hidden: !showError || undefined }),
  }
}
