import { useId, useRef, useState } from 'react'
import { connect, type RangeSliderProps as CoreRangeSliderProps, type RangeSliderWords, type RangeValue } from '@ggary/core/range-slider'
import { reactNormalizer } from '@ggary/core'
import { Input } from '../input'
import { InputGroup } from '../input-group'
import { useFormReset } from '../../utils/use-form-reset'
import { useConfigured } from '../config-provider'

export interface RangeSliderProps extends Omit<CoreRangeSliderProps, 'id' | 'value'> {
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
  const id = `gg-range-${useId().replace(/:/g, '')}`
  const [own, setOwn] = useState(defaultValue)
  const controlled = value !== undefined
  const [drafts, setDrafts] = useState<[string | null, string | null]>([null, null])

  const api = connect({ ...rest, id, value: controlled ? value : own }, reactNormalizer, {
    onValueChange: (next) => {
      if (!controlled) setOwn(next)
      onValueChange?.(next)
    },
    formatValue,
    words,
    drafts,
    onDraftChange: (index, text) => setDrafts((current) => (index === 0 ? [text, current[1]] : [current[0], text])),
  })

  const first = useRef<HTMLInputElement>(null)
  useFormReset(first, () => setOwn(defaultValue))

  // A field for each end: the kit's own Input in an InputGroup, so it looks like every other field.
  const field = (index: 0 | 1) => (
    <InputGroup prefix={api.prefix} suffix={api.suffix} size={rest.size} disabled={rest.disabled} invalid={rest.invalid}>
      <Input {...api.getFieldProps(index)} value={api.fieldText(index)} onValueChange={(text) => api.onFieldInput(index, text)} />
    </InputGroup>
  )

  return (
    <div {...api.rootProps}>
      <div {...api.headerProps}>
        <span {...api.labelProps}>{api.label}</span>
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
      <div {...api.controlProps}>
        <span {...api.trackProps} />
        <span {...api.rangeProps} />
        <input ref={first} {...api.getThumbProps(0)} />
        <input {...api.getThumbProps(1)} />
      </div>
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
    </div>
  )
}
