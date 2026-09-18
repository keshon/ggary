import { createContext, useContext, useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { connect, createFieldMachine } from '@ggary/core/field'
import { reactNormalizer, type Dict } from '@ggary/core'
import { useFormReset } from '../../utils/use-form-reset'
import { useFormField } from '../form/Form'

/**
 * The canonical control props of the nearest Field, or null. A control merges
 * them with its own (see mergeProps) rather than being spread over by the Field.
 */
const FieldContext = createContext<Dict | null>(null)

export const useFieldControl = () => useContext(FieldContext)

export interface FieldProps {
  label?: ReactNode
  hint?: ReactNode
  /** Shown when the field is invalid. Absent, the control's native message is used. */
  error?: string
  invalid?: boolean
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  /**
   * The control's name, inside a Form: the Field shows the error the form's
   * rules or its server hold for it, and the summary links to it.
   */
  name?: string
  children: ReactNode
}

export function Field(props: FieldProps) {
  const { label, hint, error: ownError, invalid: ownInvalid, required, disabled, readOnly, name, children } = props
  const id = `gg-field-${useId().replace(/:/g, '')}`

  // The form's error for this name stands over the Field's own, and shows at once, as an owner's does.
  const form = useFormField(name, `${id}-control`, typeof label === 'string' ? label : undefined)
  const invalid = ownInvalid || !!form.error
  const error = form.error ?? ownError
  const [machine] = useState(() => createFieldMachine({ id, invalid, required, disabled, readOnly }))
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const api = connect(state, machine.send, reactNormalizer, { hint: hint != null, error })

  useEffect(
    () => machine.send({ type: 'SYNC', invalid, required, disabled, readOnly }),
    [machine, invalid, required, disabled, readOnly]
  )

  // A reset form starts over: no error until the user leaves the control again.
  const root = useRef<HTMLDivElement>(null)
  useFormReset(root, () => machine.send({ type: 'RESET' }))

  return (
    <div ref={root} {...api.rootProps}>
      {label != null && <label {...api.labelProps}>{label}</label>}
      <FieldContext.Provider value={api.control}>{children}</FieldContext.Provider>
      {hint != null && <div {...api.hintProps}>{hint}</div>}
      <div {...api.errorProps}>{api.errorText}</div>
    </div>
  )
}
