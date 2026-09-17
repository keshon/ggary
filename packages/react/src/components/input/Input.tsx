import { forwardRef, type InputHTMLAttributes } from 'react'
import { connect, type InputProps as CoreInputProps } from '@ggary/core/input'
import { mergeProps, reactNormalizer } from '@ggary/core'
import { useFieldControl } from '../field/Field'

export interface InputProps
  extends CoreInputProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, keyof CoreInputProps | 'value' | 'defaultValue' | 'onChange'> {
  /** Controlled. Omit and use `defaultValue` for uncontrolled. */
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(props, ref) {
  const {
    type, size, name, placeholder, autoComplete, inputMode, disabled, readOnly, required, invalid,
    value, defaultValue, onValueChange, ...rest
  } = props

  const api = connect(
    { type, size, name, placeholder, autoComplete, inputMode, disabled, readOnly, required, invalid },
    reactNormalizer,
    { onValueChange, field: useFieldControl() ?? undefined }
  )

  const valueProps = value !== undefined ? { value } : { defaultValue }
  // Merged, not spread: a caller's own onBlur must run alongside the Field's
  // validation handler instead of silently replacing it (or being replaced).
  return <input ref={ref} {...mergeProps(rest, api.rootProps)} {...valueProps} />
})
