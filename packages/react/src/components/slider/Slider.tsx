import { forwardRef, useId, useRef, useState, type InputHTMLAttributes } from 'react'
import { connect, type SliderProps as CoreSliderProps } from '@ggary/core/slider'
import { mergeProps, reactNormalizer } from '@ggary/core'
import { useFieldControl } from '../field/Field'
import { useMergedRef } from '../../utils/use-merged-ref'
import { useFormReset } from '../../utils/use-form-reset'
import { useConfigured } from '../config-provider'

export interface SliderProps
  extends Omit<CoreSliderProps, 'id' | 'inputId' | 'value'>,
    Omit<InputHTMLAttributes<HTMLInputElement>, keyof CoreSliderProps | 'type' | 'value' | 'defaultValue' | 'onChange' | 'size'> {
  /** Controlled. Omit and use `defaultValue` for uncontrolled. */
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  /** The value in words, "6 agents": announced and shown instead of the number. */
  formatValue?: (value: number) => string
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(props, forwardedRef) {
  props = useConfigured(props, { size: true })
  const {
    min, max, step, name, label, valueText, showValue, size, disabled, required, invalid, marks,
    value, defaultValue, onValueChange, formatValue, ...rest
  } = props
  const id = `gg-slider-${useId().replace(/:/g, '')}`
  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  const controlled = value !== undefined

  const api = connect(
    { id, value: controlled ? value : uncontrolled, min, max, step, name, label, valueText, showValue, size, disabled, required, invalid, marks },
    reactNormalizer,
    {
      onValueChange: (next) => {
        if (!controlled) setUncontrolled(next)
        onValueChange?.(next)
      },
      formatValue,
      field: useFieldControl() ?? undefined,
    }
  )

  const element = useRef<HTMLInputElement | null>(null)
  const ref = useMergedRef(element, forwardedRef)
  useFormReset(element, () => setUncontrolled(defaultValue))

  // The value is always React's, even uncontrolled: the fill and the number
  // beside the track follow it, so the component has to know it while dragging.
  return (
    <div {...api.rootProps}>
      <input ref={ref} {...mergeProps(rest, api.inputProps)} value={api.value} />
      {api.showValue && <output {...api.outputProps}>{api.valueLabel}</output>}
      {api.marks.length > 0 && (
        <div {...api.marksProps}>
          {api.marks.map((mark) => (
            <span key={mark.value} {...api.getMarkProps(mark)}>
              {mark.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
})
