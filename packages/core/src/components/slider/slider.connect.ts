import type { Dict, Normalizer } from '../../types'
import { mergeProps } from '../../utils/merge-props'
import { sliderAnatomy as anatomy } from './slider.anatomy'
import type { SliderMark, SliderProps } from './slider.types'

export interface SliderConnectOptions {
  onValueChange?: (value: number) => void
  /** Turns the value into its words, "6 agents"; `valueText` wins when both are given. */
  formatValue?: (value: number) => string
  /** The canonical control props of an enclosing Field; its id wins. */
  field?: Dict
}

/** The share of the track up to the value, as a CSS percentage. A degenerate range shows its edge, not NaN. */
export function sliderFill(value: number, min: number, max: number): string {
  const share = max > min ? (value - min) / (max - min) : 0
  return `${Math.round(Math.min(1, Math.max(0, share)) * 10000) / 100}%`
}

/** A mark worked out: where it stands on the track (0 to 1), and its words. */
export interface SliderMarkView {
  value: number
  label: string
  /** 0 to 1 along the track, as `--gg-mark`. */
  at: number
  /** At an end of the track: its words stand inside the track from there, not centred past its end. */
  edge?: 'start' | 'end'
}

/**
 * Marks in order along the track, those outside it left out, each with its
 * words — its own, or the value put into words as the slider says it.
 */
export function sliderMarks(marks: SliderMark[] | undefined, min: number, max: number, format?: (value: number) => string): SliderMarkView[] {
  if (!marks || max <= min) return []
  return marks
    .map((mark) => (typeof mark === 'number' ? { value: mark, label: undefined } : mark))
    .filter((mark) => mark.value >= min && mark.value <= max)
    .sort((a, b) => a.value - b.value)
    .map((mark) => {
      const at = (mark.value - min) / (max - min)
      return { value: mark.value, label: mark.label ?? format?.(mark.value) ?? String(mark.value), at, edge: at === 0 ? ('start' as const) : at === 1 ? ('end' as const) : undefined }
    })
}

/**
 * A native `input[type=range]`: the keyboard (arrows, Page keys, Home, End),
 * the step, the slider role and its value announcement are the platform's.
 *
 * Two things the platform does not do. The track is filled up to the thumb —
 * CSS cannot read an input's value, so the share is handed over as the
 * `--slider-fill` custom property on the root, a data channel and not a look.
 * And the number beside the track: an <output> tied to the input by `for`, but
 * hidden from assistive technology, because the slider already announces its
 * value and an output is a live region that would say it a second time on
 * every step.
 */
export function connect<T = Dict>(props: SliderProps, normalize: Normalizer<T>, options: SliderConnectOptions = {}) {
  const { id, min = 0, max = 100, step = 1, name, label, showValue = false, size = 'md', disabled, required, invalid, marks } = props
  const { field, onValueChange } = options
  // Without a value the browser puts the thumb in the middle; so does the fill.
  const value = props.value ?? (max < min ? min : min + (max - min) / 2)
  const valueText = props.valueText ?? options.formatValue?.(value)
  const inputId: string = field?.id ?? props.inputId ?? `${id}-input`
  const isDisabled = Boolean(disabled || field?.disabled)
  const isInvalid = Boolean(invalid || field?.['aria-invalid'] === 'true')

  const state = {
    'data-disabled': isDisabled ? '' : undefined,
    'data-invalid': isInvalid ? '' : undefined,
  }

  const own: Dict = {
    ...anatomy.attrs('input'),
    ...state,
    type: 'range',
    id: inputId,
    name,
    min,
    max,
    step,
    // A Field's <label for> names it; an aria-label would override that label.
    'aria-label': field ? undefined : label,
    'aria-valuetext': valueText,
    disabled: disabled || undefined,
    required: required || undefined,
    'aria-invalid': invalid ? 'true' : undefined,
    onInput: onValueChange ? (event: Event) => onValueChange(Number((event.currentTarget as HTMLInputElement).value)) : undefined,
  }

  return {
    value,
    min,
    max,
    step,
    showValue,
    valueLabel: valueText ?? String(value),
    fill: sliderFill(value, min, max),
    rootProps: normalize({
      ...anatomy.attrs('root'),
      ...state,
      'data-size': size,
      style: { '--slider-fill': sliderFill(value, min, max) },
    }),
    inputProps: normalize(mergeProps(own, field)),
    outputProps: normalize({ ...anatomy.attrs('output'), ...state, for: inputId, 'aria-hidden': 'true' }),
    /** Seen, not read: the slider says its value, and the marks only help the eye find it. */
    marks: sliderMarks(marks, min, max, options.formatValue),
    marksProps: normalize({ ...anatomy.attrs('marks'), 'aria-hidden': 'true' }),
    getMarkProps: (mark: SliderMarkView) =>
      normalize({ ...anatomy.attrs('mark'), 'data-passed': mark.value <= value ? '' : undefined, 'data-edge': mark.edge, style: { '--gg-mark': Math.round(mark.at * 10000) / 10000 } }),
  }
}
