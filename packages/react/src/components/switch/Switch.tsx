import { forwardRef, useId, useRef, useState, type HTMLAttributes, type ReactNode } from 'react'
import { Switch as Primitive } from '@base-ui/react/switch'
import type { SwitchProps as CoreSwitchProps } from '@ggary/core/switch'
import { useFieldsetGroup } from '../fieldset/Fieldset'
import { useFieldControl } from '../field/Field'
import { useMergedRef } from '../../utils/use-merged-ref'
import { useFormReset } from '../../utils/use-form-reset'
import { useChoiceInputMetadata } from '../../utils/use-choice-input-metadata'

export interface SwitchProps
  extends CoreSwitchProps,
    Omit<HTMLAttributes<HTMLSpanElement>, keyof CoreSwitchProps | 'type' | 'role' | 'defaultChecked' | 'onChange' | 'children'> {
  /** Associates the submission input with a form outside its DOM parent. */
  form?: string
  /** Controlled. Omit and use `defaultChecked` for uncontrolled. */
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  children?: ReactNode
}

/** Base UI owns activation and Field registration; the public ref remains the submission input. */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(props, forwardedRef) {
  const { checked, defaultChecked = false, onCheckedChange, name, value, disabled, readOnly, required, invalid, children, id: ownId, form, ...rest } = props
  const generatedId = `gg-switch-${useId().replace(/:/g, '')}`
  const field = useFieldControl()
  const fieldset = useFieldsetGroup()
  const inputId = (field?.id as string | undefined) ?? ownId ?? generatedId
  const captionId = `${generatedId}-caption`
  const [own, setOwn] = useState(defaultChecked)
  const resolved = checked === undefined ? own : checked
  const isDisabled = Boolean(disabled || field?.disabled || fieldset?.disabled)
  const isReadOnly = Boolean(readOnly || field?.readOnly)
  const isRequired = Boolean(required || field?.required)
  const isInvalid = Boolean(invalid || field?.['aria-invalid'] === 'true')
  const state = {
    'data-state': resolved ? 'checked' : 'unchecked',
    'data-disabled': isDisabled ? '' : undefined,
    'data-readonly': isReadOnly ? '' : undefined,
    'data-invalid': isInvalid ? '' : undefined,
  }
  const part = (name: string) => ({ 'data-scope': 'switch', 'data-part': name, 'data-backend': 'base-ui' })
  const element = useRef<HTMLInputElement>(null)
  const ref = useMergedRef(element, forwardedRef)
  useFormReset(element, () => setOwn(defaultChecked))
  useChoiceInputMetadata(element, { ...part('input'), ...state,
    'aria-label': rest['aria-label'],
    'aria-invalid': isInvalid ? 'true' : undefined, 'aria-readonly': isReadOnly ? 'true' : undefined,
    'aria-describedby': (field?.['aria-describedby'] as string | undefined) ?? rest['aria-describedby'],
    role: 'switch',
  })
  const labelledBy = rest['aria-label'] ? rest['aria-labelledby'] : [rest['aria-labelledby'], field?.['aria-labelledby'], children != null && captionId].filter(Boolean).join(' ') || undefined
  return <label {...part('root')} {...state} htmlFor={inputId}>
    <span {...part('control')} {...state}>
      <Primitive.Root {...rest} {...part('toggle')} {...state} id={inputId} inputRef={ref}
        name={name} value={value} form={form} checked={resolved === true} 
        disabled={isDisabled} readOnly={isReadOnly} required={isRequired} aria-labelledby={labelledBy}
        aria-describedby={(field?.['aria-describedby'] as string | undefined) ?? rest['aria-describedby']}
        render={(toggleProps) => <span {...toggleProps} aria-invalid={isInvalid || undefined}
          data-invalid={isInvalid ? '' : undefined} aria-describedby={(field?.['aria-describedby'] as string | undefined) ?? rest['aria-describedby']} />}
        onCheckedChange={(next) => { if (checked === undefined) setOwn(next); onCheckedChange?.(next) }}>
        <Primitive.Thumb  {...part('thumb')} {...state} aria-hidden="true"  />
      </Primitive.Root>
    </span>
    {children != null && <span {...part('label')} {...state} id={captionId}>{children}</span>}
  </label>
})
