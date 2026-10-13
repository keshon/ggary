import { useFieldsetGroup } from '../fieldset/Fieldset'
import { forwardRef, useId, useRef, useState, type InputHTMLAttributes } from 'react'
import { NumberField as Primitive } from '@base-ui/react/number-field'
import type { NumberFieldProps as CoreNumberFieldProps } from '@ggary/core/number-field'
import { mergeProps, reactNormalizer } from '@ggary/core'
import { useFieldControl } from '../field/Field'
import { useMergedRef } from '../../utils/use-merged-ref'
import { useFormReset } from '../../utils/use-form-reset'
import { useConfigured } from '../config-provider'

export interface NumberFieldProps
  extends Omit<CoreNumberFieldProps, 'id' | 'inputId'>,
    Omit<InputHTMLAttributes<HTMLInputElement>, keyof CoreNumberFieldProps | 'type' | 'value' | 'defaultValue' | 'onChange' | 'size'> {
  /** Controlled: `null` is empty. Omit and use `defaultValue` for uncontrolled. */
  value?: number | null
  defaultValue?: number | null
  /** A number, or null while the field is empty or holds no number yet. */
  onValueChange?: (value: number | null) => void
  /** Fill the available inline space. Standalone controls otherwise use the theme's stable field width. */
  fullWidth?: boolean
}

const part = (name: string) => ({ 'data-scope': 'number-field', 'data-part': name, 'data-backend': 'base-ui' })

export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(function NumberField(props, forwardedRef) {
  props = useConfigured(props, { size: true })
  const { min, max, step = 1, name, label, axis, placeholder, size = 'md', disabled, readOnly, required, invalid,
    value, defaultValue, onValueChange, fullWidth, form, ...rest } = props
  const field = useFieldControl()
  const group = useFieldsetGroup()
  const id = useId()
  const [own, setOwn] = useState(defaultValue ?? null)
  const element = useRef<HTMLInputElement>(null)
  const ref = useMergedRef(element, forwardedRef)
  useFormReset(element, () => setOwn(defaultValue ?? null))
  const isDisabled = Boolean(disabled || field?.disabled || group?.disabled)
  const isReadOnly = Boolean(readOnly || field?.readOnly)
  const isInvalid = Boolean(invalid || field?.['aria-invalid'] === 'true')
  const state = { 'data-size': size, 'data-disabled': isDisabled ? '' : undefined, 'data-full-width': fullWidth ? '' : undefined,
    'data-readonly': isReadOnly ? '' : undefined, 'data-invalid': isInvalid ? '' : undefined }
  return <Primitive.Root {...part('root')} {...state} render={(rootProps) => <span {...rootProps} data-invalid={isInvalid ? '' : undefined} />}
    id={field?.id ?? `gg-number-${id}`} min={min} max={max} step={step}
    largeStep={step * 10} smallStep={step * .1} allowOutOfRange format={{ useGrouping: false }}
    name={name} form={form} disabled={isDisabled} readOnly={isReadOnly} required={Boolean(required || field?.required)}
    value={value === undefined ? own : value}
    onValueChange={(next) => { if (value === undefined) setOwn(next); onValueChange?.(next) }}>
    {axis && <Primitive.ScrubArea {...part('axis')} {...state} aria-hidden="true"
      data-scrub={!isDisabled && !isReadOnly ? '' : undefined} pixelSensitivity={2}>{axis}</Primitive.ScrubArea>}
    <Primitive.Input {...mergeProps(rest, reactNormalizer(field ?? {}))} {...part('input')} {...state}
      ref={ref} placeholder={placeholder} aria-label={field ? undefined : label ?? rest['aria-label']}
      aria-invalid={isInvalid || undefined}
      render={(inputProps) => <input {...inputProps} aria-invalid={isInvalid || undefined}
        aria-describedby={(field ? field['aria-describedby'] : inputProps['aria-describedby']) as string | undefined}
        data-invalid={isInvalid ? '' : undefined} />} />
  </Primitive.Root>
})
