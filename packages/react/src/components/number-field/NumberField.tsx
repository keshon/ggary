import { forwardRef, useEffect, useId, useLayoutEffect, useRef, type InputHTMLAttributes } from 'react'
import { connect, readNumber, type NumberFieldProps as CoreNumberFieldProps } from '@ggary/core/number-field'
import { attachScrub, mergeProps, reactNormalizer } from '@ggary/core'
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
}

const text = (value: number | null | undefined) => (value === null || value === undefined ? '' : String(value))

export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(function NumberField(props, forwardedRef) {
  props = useConfigured(props, { size: true })
  const {
    min, max, step, name, label, axis, placeholder, size, disabled, readOnly, required, invalid,
    value, defaultValue, onValueChange, ...rest
  } = props
  const id = `gg-number-${useId().replace(/:/g, '')}`

  const api = connect(
    { id, min, max, step, name, label, axis, placeholder, size, disabled, readOnly, required, invalid },
    reactNormalizer,
    { onValueChange, field: useFieldControl() ?? undefined }
  )

  const element = useRef<HTMLInputElement | null>(null)
  const ref = useMergedRef(element, forwardedRef)
  const axisHandle = useRef<HTMLSpanElement | null>(null)

  // Not a controlled input in React's sense. Typing "1." holds no new number,
  // and writing the owner's 1 back would eat the dot under the caret; so the
  // owner's value is written only when it differs from what the input holds.
  const sync = () => {
    const input = element.current
    if (input && value !== undefined && readNumber(input) !== value) input.value = text(value)
  }
  useLayoutEffect(sync, [value])
  useFormReset(element, sync)

  useEffect(() => {
    const handle = axisHandle.current
    return handle ? attachScrub(handle, () => element.current) : undefined
  }, [api.showAxis])

  return (
    <span {...api.rootProps}>
      {api.showAxis && (
        <span ref={axisHandle} {...api.axisProps}>
          {api.axis}
        </span>
      )}
      <input ref={ref} {...mergeProps(rest, api.inputProps)} defaultValue={text(value === undefined ? defaultValue : value)} />
    </span>
  )
})
