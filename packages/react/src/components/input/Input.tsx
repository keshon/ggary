import { forwardRef, useRef, type InputHTMLAttributes } from 'react'
import { connect, type InputProps as CoreInputProps } from '@ggary/core/input'
import { mergeProps, reactNormalizer } from '@ggary/core'
import { useFieldControl } from '../field/Field'
import { useMergedRef } from '../../utils/use-merged-ref'
import { useFormReset } from '../../utils/use-form-reset'

export interface InputProps
  extends CoreInputProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, keyof CoreInputProps | 'value' | 'defaultValue' | 'onChange'> {
  /** Controlled. Omit and use `defaultValue` for uncontrolled. */
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(props, forwardedRef) {
  const {
    type, size, name, placeholder, autoComplete, inputMode, disabled, readOnly, required, invalid,
    value, defaultValue, onValueChange, ...rest
  } = props

  const api = connect(
    { type, size, name, placeholder, autoComplete, inputMode, disabled, readOnly, required, invalid },
    reactNormalizer,
    { onValueChange, field: useFieldControl() ?? undefined }
  )

  // Uncontrolled, the browser resets the value itself; controlled, the re-render
  // puts the owner's value back over what the reset wrote.
  const element = useRef<HTMLInputElement | null>(null)
  const ref = useMergedRef(element, forwardedRef)
  useFormReset(element)

  const valueProps = value !== undefined ? { value } : { defaultValue }
  // Merged, not spread: a caller's own onBlur must run alongside the Field's
  // validation handler instead of silently replacing it (or being replaced).
  return <input ref={ref} {...mergeProps(rest, api.rootProps)} {...valueProps} />
})
