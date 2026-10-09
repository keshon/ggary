import { createContext, useContext, useId, useRef, useState, type ReactNode } from 'react'
import { Fieldset as Primitive } from '@base-ui/react/fieldset'
import { groupValidity, type GroupContext } from '@ggary/core'
import { useFormField } from '../form/Form'
import { useFormReset } from '../../utils/use-form-reset'

const FieldsetContext = createContext<(GroupContext & { refresh: () => void; name?: string }) | null>(null)
export const useFieldsetGroup = () => useContext(FieldsetContext)

export interface FieldsetProps {
  /** Field name for Form rules/server errors and the summary. Groups inherit it. */
  name?: string
  legend?: ReactNode
  hint?: ReactNode
  error?: string
  invalid?: boolean
  required?: boolean
  disabled?: boolean
  children: ReactNode
}

/** Base UI owns the semantic group; GGary owns native aggregate validation timing. */
export function Fieldset({ name, legend, hint, error, invalid, required, disabled, children }: FieldsetProps) {
  const parent = useFieldsetGroup()
  const id = `gg-fieldset-${useId().replace(/:/g, '')}`
  const form = useFormField(name, id, typeof legend === 'string' ? legend : undefined)
  const root = useRef<HTMLFieldSetElement>(null)
  const [validation, setValidation] = useState({ touched: false, valid: true, message: '' })
  const isDisabled = Boolean(disabled || parent?.disabled)
  const isInvalid = Boolean(invalid || form.error || (validation.touched && !validation.valid))
  const errorText = isInvalid ? (form.error ?? error ?? validation.message) : ''
  const showError = errorText !== ''
  const describedBy = showError ? `${id}-error` : hint != null ? `${id}-hint` : undefined
  const attrs = { 'data-invalid': isInvalid ? '' : undefined, 'data-required': required ? '' : undefined, 'data-disabled': isDisabled ? '' : undefined }
  const part = (part: string) => ({ 'data-scope': 'fieldset', 'data-part': part, 'data-backend': 'base-ui' })
  const refresh = () => setValidation(previous => {
    if (!previous.touched) return previous
    const next = groupValidity(root.current)
    return next.valid === previous.valid && next.message === previous.message ? previous : { touched: true, ...next }
  })
  const reveal = () => setValidation({ touched: true, ...groupValidity(root.current) })
  useFormReset(root, () => setValidation({ touched: false, valid: true, message: '' }))
  return <Primitive.Root ref={root} {...part('root')} {...attrs} id={id} disabled={isDisabled} tabIndex={name ? -1 : undefined}
    aria-describedby={describedBy}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) reveal() }}
    onInput={refresh} onChange={refresh} onInvalidCapture={reveal}>
    {legend != null && <Primitive.Legend render={<legend {...part('legend')} />} {...part('legend')} {...attrs} id={`${id}-legend`}>{legend}</Primitive.Legend>}
    <div {...part('content')}>
      <FieldsetContext.Provider value={{ name, invalid: isInvalid, required: Boolean(required), disabled: isDisabled, refresh }}>{children}</FieldsetContext.Provider>
    </div>
    {hint != null && <div {...part('hint')} id={`${id}-hint`} hidden={showError}>{hint}</div>}
    <div {...part('error')} id={`${id}-error`} hidden={!showError}>{errorText}</div>
  </Primitive.Root>
}
