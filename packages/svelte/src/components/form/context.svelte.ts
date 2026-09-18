import { connectFieldError, formEdited, formErrorOf, type FormEvent, type FormState } from '@ggary/core/form'
import { svelteNormalizer, type Machine } from '@ggary/core'
import { getContext } from 'svelte'

/** The form around: its machine, set by Form. */
export const FORM_CONTEXT = Symbol('gg-form')
export type FormMachine = Machine<FormState, FormEvent>

/** The state of the form around, kept current; null outside one. */
export function useFormState(): { readonly current: FormState | null } {
  const machine = getContext<FormMachine | undefined>(FORM_CONTEXT)
  let state = $state.raw<FormState | null>(machine?.getState() ?? null)
  $effect(() => machine?.subscribe((next) => (state = next)))
  return {
    get current() {
      return state
    },
  }
}

/**
 * A field of the form around, by name: it registers where its control is and
 * what it is called, for the summary and the focus, and reads the error the
 * form holds for it. `edited()` tells the form its value changed — for a
 * control whose hidden input fires nothing. Read through getters: the name,
 * id and label are the component's props, and may change.
 */
export function useFormField(name: () => string | undefined, controlId: () => string, label: () => string | undefined) {
  const machine = getContext<FormMachine | undefined>(FORM_CONTEXT)
  const form = useFormState()
  $effect(() => {
    const key = name()
    const id = controlId()
    if (!machine || !key) return
    machine.send({ type: 'REGISTER', name: key, id, label: label() ?? '' })
    return () => machine.send({ type: 'UNREGISTER', name: key, id })
  })
  const error = $derived(formErrorOf(form.current, name()))
  const field = $derived(connectFieldError(error, `${controlId()}-form-error`, svelteNormalizer))
  return {
    get error() {
      return error
    },
    get field() {
      return field
    },
    edited: () => formEdited(document.getElementById(controlId()), name()),
  }
}
