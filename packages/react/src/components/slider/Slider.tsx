import { useFieldsetGroup } from '../fieldset/Fieldset'
import { forwardRef, useEffect, useId, useRef, useState, type InputHTMLAttributes } from 'react'
import { Slider as Primitive } from '@base-ui/react/slider'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { connect, type SliderProps as CoreSliderProps } from '@ggary/core/slider'
import { observeSliderLabels, reactNormalizer } from '@ggary/core'
import { useFieldControl } from '../field/Field'
import { useMergedRef } from '../../utils/use-merged-ref'
import { useFormReset } from '../../utils/use-form-reset'
import { sliderInput } from '../../utils/slider-input'
import { useConfigured, useConfig } from '../config-provider'

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

const part = (name: string) => ({ 'data-scope': 'slider', 'data-part': name, 'data-backend': 'base-ui' })

export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(props, forwardedRef) {
  props = useConfigured(props, { size: true })
  const { min = 0, max = 100, step = 1, name, label, valueText, showValue, size, disabled, readOnly, required, invalid, marks,
    value, defaultValue, onValueChange, formatValue, form, ...rest } = props
  const id = `gg-slider-${useId().replace(/:/g, '')}`
  const [own, setOwn] = useState(defaultValue ?? min + (max - min) / 2)
  const field = useFieldControl()
  const group = useFieldsetGroup()
  const isReadOnly = !!(readOnly || field?.readOnly)
  const config = useConfig()
  // Core supplies presentation only: no legacy input callback is installed.
  const api = connect({ id, value: value ?? own, min, max, step, name, label, valueText, showValue, size, disabled, required, invalid, marks }, reactNormalizer, { formatValue, field: field ?? undefined })
  const marksRef = useRef<HTMLDivElement>(null)
  useEffect(() => observeSliderLabels(marksRef.current), [marks])
  const element = useRef<HTMLInputElement>(null)
  const ref = useMergedRef(element, forwardedRef)
  useFormReset(element, () => setOwn(defaultValue ?? min + (max - min) / 2))
  const { type: _type, value: _value, min: _min, max: _max, step: _step, ...inputAttributes } = api.inputProps
  return <DirectionProvider direction={config.dir ?? 'ltr'}>
    <Primitive.Root<number> {...api.rootProps} {...part('root')} id={api.inputProps.id} value={api.value} render={(rootProps) => <div {...rootProps} id={id} />}
      min={min} max={max} step={step} name={name} form={form} disabled={Boolean(disabled || field?.disabled || group?.disabled)} thumbAlignment="edge"
      onValueChange={(next) => { if (isReadOnly) return; if (value === undefined) setOwn(next); onValueChange?.(next) }}>
      <Primitive.Control {...part('control')}>
        <Primitive.Track {...part('track')}><Primitive.Indicator {...part('indicator')} /></Primitive.Track>
        <Primitive.Thumb {...part('thumb')} inputRef={ref} aria-readonly={isReadOnly || undefined} aria-label={field ? undefined : label ?? rest['aria-label']}
          aria-describedby={api.inputProps['aria-describedby']} aria-valuetext={valueText ?? formatValue?.(api.value)}
          render={(thumbProps) => <div {...thumbProps}>{sliderInput(thumbProps.children, { ...rest, ...inputAttributes })}</div>} />
      </Primitive.Control>
      {api.showValue && <output {...api.outputProps}>{api.valueLabel}</output>}
      {api.marks.length > 0 && <div ref={marksRef} {...api.marksProps}>{api.marks.map((mark) => <span key={mark.value} {...api.getMarkProps(mark)}><span data-scope="slider" data-part="mark-label">{mark.label}</span></span>)}</div>}
    </Primitive.Root>
  </DirectionProvider>
})
