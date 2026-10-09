import { FieldEditorBoundary, useFieldControl, useFieldComposition } from '../field/Field'
import { SelectionConstraint } from '../../utils/selection-constraint'
import { useFormField } from '../form/Form'
import { useFieldsetGroup } from '../fieldset/Fieldset'
import { useId, useRef, useState } from 'react'
import { connect, type RangeSliderProps as CoreRangeSliderProps, type RangeSliderWords, type RangeValue } from '@ggary/core/range-slider'
import { reactNormalizer } from '@ggary/core'
import { Input } from '../input'
import { InputGroup } from '../input-group'
import { useFormReset } from '../../utils/use-form-reset'
import { Slider as Primitive } from '@base-ui/react/slider'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { sliderInput } from '../../utils/slider-input'
import { useConfig } from '../config-provider'
import { useConfigured } from '../config-provider'

export interface RangeSliderProps extends Omit<CoreRangeSliderProps, 'id' | 'value' | 'label'> {
  label?: string
  readOnly?: boolean
  /** Controlled: `[lower, upper]`. Omit and use `defaultValue` for uncontrolled. */
  value?: RangeValue
  /** Default: the whole track. */
  defaultValue?: RangeValue
  onValueChange?: (value: RangeValue) => void
  /** A value in words, "€20": in the header, the bubbles, the marks, and what each thumb says. */
  formatValue?: (value: number) => string
  words?: RangeSliderWords
}

/** A range between two ends, each a thumb on one track: a price from and to, a run time from and to. */
export function RangeSlider(props: RangeSliderProps) {
  props = useConfigured(props, { size: true, words: 'rangeSlider' })
  const { value, defaultValue, onValueChange, formatValue, words, ...rest } = props
  const config = useConfig()
  const group = useFieldsetGroup()
  const outerField = useFieldControl()
  const composition = useFieldComposition()
  rest.disabled = !!(rest.disabled || group?.disabled || outerField?.disabled)
  const readOnly = !!(props.readOnly || outerField?.readOnly)
  const name = composition?.name ?? rest.name
  const names = Array.isArray(name) ? name : [name, name]
  const invalid = !!(rest.invalid || outerField?.['aria-invalid'])
  const id = `gg-range-${useId().replace(/:/g, '')}`
  const controlId = String(outerField?.id ?? `${id}-start`)
  const form = useFormField(composition?.name ? undefined : typeof name === 'string' ? name : undefined, controlId, props.label)
  const [own, setOwn] = useState(defaultValue)
  const controlled = value !== undefined
  const [drafts, setDrafts] = useState<[string | null, string | null]>([null, null])

  const api = connect({ ...rest, label: rest.label ?? '', id, value: controlled ? value : own }, reactNormalizer, {
    onValueChange: (next) => {
      if (readOnly || rest.disabled) return
      if (!controlled) setOwn(next)
      onValueChange?.(next)
    },
    formatValue,
    words,
    drafts,
    onDraftChange: (index, text) => { if (readOnly || rest.disabled) return; setDrafts((current) => (index === 0 ? [text, current[1]] : [current[0], text])) },
  })

  const first = useRef<HTMLInputElement>(null)
  useFormReset(first, () => { setOwn(defaultValue); setDrafts([null, null]) })

  // A field for each end: the kit's own Input in an InputGroup, so it looks like every other field.
  const field = (index: 0 | 1) => (
    <FieldEditorBoundary><InputGroup prefix={api.prefix} suffix={api.suffix} size={rest.size} disabled={rest.disabled} invalid={rest.invalid}>
      <Input {...api.getFieldProps(index)} id={`${id}-editor-${index}`} readOnly={readOnly}
        aria-describedby={outerField?.['aria-describedby']} aria-invalid={invalid || undefined}
        onKeyDown={event => { if (event.key === 'Enter') event.preventDefault(); if (!readOnly) api.getFieldProps(index).onKeyDown?.(event) }} value={api.fieldText(index)} onValueChange={(text) => api.onFieldInput(index, text)} />
    </InputGroup></FieldEditorBoundary>
  )

  return (
    <DirectionProvider direction={config.dir ?? 'ltr'}>
    <FieldEditorBoundary>
    <Primitive.Root<RangeValue> {...api.rootProps} data-backend="base-ui"
      aria-labelledby={outerField?.['aria-labelledby'] ?? api.rootProps['aria-labelledby']}
      value={api.value} min={rest.min ?? 0} max={rest.max ?? 100} step={rest.step ?? 1}
      minStepsBetweenValues={Math.ceil((rest.minGap ?? 0) / (rest.step ?? 1))} thumbCollisionBehavior="none" thumbAlignment="edge"
      disabled={rest.disabled}
      onValueChange={(next) => { if (readOnly || rest.disabled) return; if (!controlled) setOwn(next); onValueChange?.(next) }}>
      <div {...api.headerProps}>
        {!outerField?.['aria-labelledby'] && <span {...api.labelProps}>{api.label}</span>}
        {api.valueDisplay === 'header' && <span {...api.valueProps}>{api.valueText}</span>}
      </div>
      {api.valueDisplay === 'bubbles' && (
        <div {...api.bubblesProps}>
          {api.bubbles.map((bubble) => (
            <span key={bubble.which} {...api.getBubbleProps(bubble.which)}>
              {bubble.text}
            </span>
          ))}
        </div>
      )}
      <Primitive.Control data-scope="range-slider" data-part="control" data-backend="base-ui">
        <Primitive.Track {...api.trackProps} />
        <Primitive.Indicator {...api.rangeProps} style={{ position: 'absolute', height: 'var(--range-track)' }} />
        {([0, 1] as const).map((index) => <Primitive.Thumb key={index} index={index}
          data-scope="range-slider" data-part="thumb-handle" data-backend="base-ui"
          inputRef={index === 0 ? first : undefined} aria-readonly={readOnly || undefined} aria-describedby={outerField?.['aria-describedby']} aria-label={index === 0 ? words?.start ?? 'Minimum' : words?.end ?? 'Maximum'}
          getAriaValueText={formatValue ? (_formatted, value) => formatValue(value) : undefined}
          render={(thumbProps) => <div {...thumbProps}>{sliderInput(thumbProps.children, {
            'data-scope': 'range-slider', 'data-part': 'thumb', 'data-thumb': index === 0 ? 'start' : 'end',
            name: undefined, id: index === 0 ? controlId : `${id}-end`,
            'aria-describedby': outerField?.['aria-describedby'],
            'aria-invalid': invalid || undefined,
          } as React.InputHTMLAttributes<HTMLInputElement>)}</div>} />)}
      </Primitive.Control>
      {api.marks.length > 0 && (
        <div {...api.marksProps}>
          {api.marks.map((mark) => (
            <span key={mark.value} {...api.getMarkProps(mark)}>
              {mark.label}
            </span>
          ))}
        </div>
      )}
      {api.valueDisplay === 'inputs' && (
        <div {...api.fieldsProps}>
          {field(0)}
          <span {...api.separatorProps}>–</span>
          {field(1)}
        </div>
      )}
    </Primitive.Root>
    </FieldEditorBoundary>
    <SelectionConstraint id={`${id}-constraint`} controlId={controlId} name={names[0]}
      value={String(api.value[0])} revision={api.value[1]} required={false} disabled={!!rest.disabled} readOnly={readOnly}
      message={drafts.some(draft => draft !== null) ? 'Confirm the typed range with Enter or leave the editor.'
        : api.value[1] - api.value[0] < (rest.minGap ?? 0) ? 'Choose a range with the required minimum gap.' : ''}
      focusTarget={first} onValidityChange={() => {
        composition?.edited()
        if (!composition?.name) form.edited(first.current)
        group?.refresh()
      }} />
    {names[1] && <input type="hidden" name={names[1]} value={api.value[1]} disabled={!!rest.disabled} />}
    <span {...form.field.errorProps}>{form.error}</span>
    </DirectionProvider>
  )
}
