import { createContext, useContext, useEffect, useId, useRef, useState, useSyncExternalStore, type FormHTMLAttributes, type ReactNode } from 'react'
import {
  connectFieldError,
  connectForm,
  connectSummary,
  createFormMachine,
  formErrorOf,
  type AttachFormOptions,
  type FormEvent,
  type FormState,
  type FormStatus,
  type FormSummaryWords,
} from '@ggary/core/form'
import { reactNormalizer, type Machine } from '@ggary/core'
import { useConfigured } from '../config-provider'
import { createFormWorkflow } from './form-workflow'

type FormMachine = Machine<FormState, FormEvent>
const FormContext = createContext<{ machine: FormMachine; edited: (name: string) => void } | null>(null)

const initial = (machine: FormMachine | null | undefined) => () => machine?.getState() ?? null
const noop = () => () => {}

/** The state of the form around, or null outside one. */
export function useFormState(): FormState | null {
  const machine = useContext(FormContext)?.machine
  const read = initial(machine)
  return useSyncExternalStore(machine?.subscribe ?? noop, read, read)
}

/**
 * A field of the form around, by name: it registers where its control is and
 * what it is called, for the summary and the focus, and gets the error the
 * form holds for it. `edited()` tells the form its value changed — for a
 * control whose hidden input fires nothing.
 */
export function useFormField(name: string | undefined, controlId: string, label?: string) {
  const machine = useContext(FormContext)?.machine
  const context = useContext(FormContext)
  const state = useFormState()
  useEffect(() => {
    if (!machine || !name) return
    machine.send({ type: 'REGISTER', name, id: controlId, label: label ?? '' })
    return () => machine.send({ type: 'UNREGISTER', name, id: controlId })
  }, [machine, name, controlId, label])
  const error = formErrorOf(state, name)
  return {
    error,
    field: connectFieldError(error, `${controlId}-form-error`, reactNormalizer),
    edited: (element: Element | null) => { if (element && name) context?.edited(name) },
  }
}

export type FormProps = Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> &
  AttachFormOptions & {
    children?: ReactNode
    onStatusChange?: (status: FormStatus) => void
  }

/**
 * A form that checks itself on submit: the browser's constraints, your
 * `validate` rules, and the errors `onSubmit` returns from a server. Without
 * `onSubmit`, a valid form submits natively, to its `action`.
 */
export function Form(props: FormProps) {
  const { validate, onSubmit, onStatusChange, children, ...rest } = props
  const id = `gg-form-${useId().replace(/:/g, '')}`
  const options = useRef<AttachFormOptions>({ validate, onSubmit })
  options.current = { validate, onSubmit }
  const callbacks = useRef({ onStatusChange })
  callbacks.current = { onStatusChange }
  const [machine] = useState(() => createFormMachine({ id, onStatusChange: (status) => callbacks.current.onStatusChange?.(status) }))
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const api = connectForm(state, reactNormalizer)

  const formRef = useRef<HTMLFormElement>(null)
  const workflow = useRef<ReturnType<typeof createFormWorkflow> | null>(null)
  useEffect(() => {
    const form = formRef.current
    if (!form) return
    const current = createFormWorkflow(form, machine, () => options.current)
    workflow.current = current
    return () => { current.dispose(); workflow.current = null }
  }, [machine])

  return (
    <form ref={formRef} {...rest} {...api.rootProps} noValidate
      onSubmit={(event) => workflow.current?.submit(event.nativeEvent as SubmitEvent)}
      onInput={(event) => { rest.onInput?.(event); if (!event.defaultPrevented) workflow.current?.edit(event.nativeEvent) }}
      onChange={(event) => { rest.onChange?.(event); if (!event.defaultPrevented) workflow.current?.edit(event.nativeEvent) }}
      onReset={(event) => { rest.onReset?.(event); if (!event.defaultPrevented) workflow.current?.reset() }}>
      <FormContext.Provider value={{ machine, edited: (name) => workflow.current?.edited(name) }}>{children}</FormContext.Provider>
    </form>
  )
}

export interface FormSummaryProps {
  words?: FormSummaryWords
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
}

/** The form's errors in one place, each a link to its field. Shown after a submit that found some. */
export function FormSummary(own: FormSummaryProps) {
  const { words, headingLevel } = useConfigured(own, { words: 'formSummary' })
  const machine = useContext(FormContext)?.machine
  const state = useFormState()
  useEffect(() => {
    if (!machine) return
    machine.send({ type: 'SUMMARY_MOUNT' })
    return () => machine.send({ type: 'SUMMARY_UNMOUNT' })
  }, [machine])
  if (!state) return null
  const api = connectSummary(state, reactNormalizer, { words, headingLevel })
  return (
    <div {...api.rootProps}>
      <div {...api.titleProps}>{api.title}</div>
      {api.message && <p {...api.messageProps}>{api.message}</p>}
      {api.items.length > 0 && (
        <ul {...api.listProps}>
          {api.items.map((item) => (
            <li key={`${item.id}-${item.name}`} {...api.itemProps}>
              <a {...api.getLinkProps(item)}>{api.itemText(item)}</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
