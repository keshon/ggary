import { createContext, useContext, useId, useRef, useState, type ReactNode } from 'react'
import { Field as BaseField } from '@base-ui/react/field'
import { fieldAnatomy } from '@ggary/core/field'
import type { Dict } from '@ggary/core'
import { useFormReset } from '../../utils/use-form-reset'
import { useFormField } from '../form/Form'

/**
 * GGary control metadata, without legacy validation handlers. Custom React
 * controls must register through a Base UI primitive (or Field.Control rendered
 * as their native element) to participate in this Field's validation.
 */
const FieldContext = createContext<Dict | null>(null)
export const useFieldControl = () => useContext(FieldContext)
// Submission ownership is separate from DOM metadata: copying a name onto every
// child would make compound controls submit their display and canonical values.
const FieldCompositionContext = createContext<{ name?: string; edited: () => void } | null>(null)
export const useFieldComposition = () => useContext(FieldCompositionContext)

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
  const form = useFormField(name, `${id}-control`, typeof label === 'string' ? label : undefined)
  const declaredInvalid = !!ownInvalid || !!form.error
  const error = form.error ?? ownError
  // Visibility is GGary policy; constraint computation belongs to Base UI.
  // Reset hides native errors without replacing the user's control or its ref.
  const [revealed, setRevealed] = useState(false)
  const revealRef = useRef(false)
  const actions = useRef<BaseField.Root.Actions | null>(null)
  const root = useRef<HTMLDivElement>(null)
  useFormReset(root, () => { revealRef.current = false; setRevealed(false) })
  const validate = () => {
    revealRef.current = true
    setRevealed(true)
    actions.current?.validate()
  }
  const isControl = (target: EventTarget | null) => target instanceof Element && target.matches('input,textarea,select,[role=checkbox],[role=switch]')
  const attrs = {
    'data-disabled': disabled ? '' : undefined,
    'data-readonly': readOnly ? '' : undefined,
    'data-required': required ? '' : undefined,
  }
  return (
    <BaseField.Root ref={root} id={id} name={name} disabled={disabled} invalid={declaredInvalid}
      actionsRef={actions} touched={revealed} validationMode="onBlur" data-backend="base-ui" {...fieldAnatomy.attrs('root')} {...attrs}
      render={(rootProps, state) => <div {...rootProps} data-invalid={declaredInvalid || (revealed && state.valid === false) ? '' : undefined} />}
      onBlurCapture={(event) => {
        // Base UI choice inputs redirect focus to their visible control. That
        // internal transfer (or a password reveal button) is not leaving Field.
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
        const next = event.relatedTarget as Node | null
        if (next && Array.from(event.currentTarget.querySelectorAll('[aria-controls]')).some(control =>
          control.getAttribute('aria-controls')?.split(/\s+/).some(id => control.ownerDocument.getElementById(id)?.contains(next)))) return
        validate()
      }}
      onInvalidCapture={() => validate()}
      onChange={(event) => {
        if (!isControl(event.target) || !revealRef.current) return
        // Validate after the control has accepted/refused the edit and React restored its DOM value.
        queueMicrotask(() => { if (revealRef.current) actions.current?.validate() })
      }}>
      <BaseField.Validity>
        {(validity) => {
          const invalid = declaredInvalid || (revealed && validity.validity.valid === false)
          const errorText = invalid ? (error ?? validity.error) : ''
          const showError = !!errorText
          const describedBy = showError ? `${id}-error` : hint != null ? `${id}-hint` : undefined
          const control: Dict = {
            id: `${id}-control`, required: required || undefined, disabled: disabled || undefined,
            readOnly: readOnly || undefined, 'aria-invalid': invalid ? 'true' : undefined,
            'data-invalid': invalid ? '' : undefined, 'aria-describedby': describedBy,
            'aria-labelledby': label != null ? `${id}-label` : undefined,
          }
          return <>
            {label != null && <BaseField.Label {...fieldAnatomy.attrs('label')} {...attrs}
              id={`${id}-label`} htmlFor={`${id}-control`}
              render={(labelProps) => <label {...labelProps} data-invalid={invalid ? '' : undefined} />}>{label}</BaseField.Label>}
            <FieldCompositionContext.Provider value={{ name, edited: () => {
              form.edited(root.current)
              queueMicrotask(() => { if (revealRef.current) actions.current?.validate() })
            } }}>
              <FieldContext.Provider value={control}>{children}</FieldContext.Provider>
            </FieldCompositionContext.Provider>
            {hint != null && <div {...fieldAnatomy.attrs('hint')} id={`${id}-hint`} hidden={showError}>{hint}</div>}
            <div {...fieldAnatomy.attrs('error')} id={`${id}-error`} hidden={!showError}>{errorText}</div>
          </>
        }}
      </BaseField.Validity>
    </BaseField.Root>
  )
}

/** Private boundary for editors whose enclosing composite owns canonical validation. */
export function FieldEditorBoundary({ children }: { children: ReactNode }) {
  return <FieldCompositionContext.Provider value={null}><FieldContext.Provider value={null}>
    <BaseField.Root render={props => <div {...props} style={{ display: 'contents' }} />}>{children}</BaseField.Root>
  </FieldContext.Provider></FieldCompositionContext.Provider>
}
