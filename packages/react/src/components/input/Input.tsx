import { forwardRef, useEffect, useRef, useState, type InputHTMLAttributes } from 'react'
import { connect, hideOnSubmit, type InputProps as CoreInputProps, type InputWords } from '@ggary/core/input'
import { mergeProps, reactNormalizer } from '@ggary/core'
import { useFieldControl } from '../field/Field'
import { useMergedRef } from '../../utils/use-merged-ref'
import { useFormReset } from '../../utils/use-form-reset'
import { useConfigured } from '../config-provider'

export interface InputProps
  extends CoreInputProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, keyof CoreInputProps | 'value' | 'defaultValue' | 'onChange'> {
  /** Controlled. Omit and use `defaultValue` for uncontrolled. */
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  words?: InputWords
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(props, forwardedRef) {
  props = useConfigured(props, { size: true, words: 'input' })
  const {
    type, size, name, placeholder, autoComplete, inputMode, disabled, readOnly, required, invalid, reveal,
    value, defaultValue, onValueChange, words, ...rest
  } = props
  const [revealed, setRevealed] = useState(false)

  const api = connect(
    { type, size, name, placeholder, autoComplete, inputMode, disabled, readOnly, required, invalid, reveal },
    reactNormalizer,
    { onValueChange, field: useFieldControl() ?? undefined, revealed, onRevealChange: setRevealed, words }
  )

  // Uncontrolled, the browser resets the value itself; controlled, the re-render
  // puts the owner's value back over what the reset wrote.
  const element = useRef<HTMLInputElement | null>(null)
  const ref = useMergedRef(element, forwardedRef)
  useFormReset(element)
  useEffect(() => (api.canReveal ? hideOnSubmit(element.current, () => setRevealed(false)) : undefined), [api.canReveal])

  const valueProps = value !== undefined ? { value } : { defaultValue }
  // Merged, not spread: a caller's own onBlur must run alongside the Field's
  // validation handler instead of silently replacing it (or being replaced).
  const input = <input ref={ref} {...mergeProps(rest, api.rootProps)} {...valueProps} />
  if (!api.canReveal) return input
  return (
    <span {...api.fieldProps}>
      {input}
      <button {...api.revealProps}>
        <span {...api.revealIconProps} />
      </button>
    </span>
  )
})
