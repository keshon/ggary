import type { Dict, Normalizer } from '../../types'
import { sliderMarks, type SliderMarkView } from '../slider/slider.connect'
import { rangeSliderAnatomy as anatomy } from './range-slider.anatomy'
import type { RangeSliderProps, RangeSliderWords, RangeValue } from './range-slider.types'

export interface RangeSliderConnectOptions {
  onValueChange?: (value: RangeValue) => void
  /** Turns a value into its words, "€20": the header, the bubbles, the marks and what each thumb says. */
  formatValue?: (value: number) => string
  words?: RangeSliderWords
  /** What is being typed in each of the `inputs` fields, until it is committed; the adapter keeps it. */
  drafts?: [string | null, string | null]
  onDraftChange?: (index: 0 | 1, text: string | null) => void
}

export const rangeSliderIds = (id: string) => ({ label: `${id}-label` })

/** Two thumbs closer than this share of the track share one bubble, "€20 – €25", rather than piling up. */
const MERGE = 0.14

const round = (value: number, step: number) => {
  const digits = (String(step).split('.')[1] ?? '').length
  return Number(value.toFixed(digits))
}

/**
 * Keeps an end where it may stand: on the track, on the step, and on its own
 * side of the other end, `minGap` away. An end pushed past the other stops
 * against it rather than swapping places.
 */
export function placeEnd(value: RangeValue, index: 0 | 1, next: number, options: { min: number; max: number; step: number; minGap: number }): RangeValue {
  const { min, max, step, minGap } = options
  const snapped = round(min + Math.round((next - min) / step) * step, step)
  const low = index === 0 ? min : value[0] + minGap
  const high = index === 0 ? value[1] - minGap : max
  const placed = Math.min(Math.max(snapped, low), Math.max(low, high))
  return index === 0 ? [placed, value[1]] : [value[0], placed]
}

/**
 * The thumbs are two native range inputs laid over one track, so each is a
 * real slider — named "Minimum" and "Maximum" inside a group named by the
 * label — with the browser's keys and its announcement. The kit adds what two
 * inputs cannot do alone: the fill between them, the rule that they do not
 * cross (an input pushed past the other is written back to where it stops),
 * a press on the track moving the nearer thumb there, and which thumb is in
 * front — the lower one once it is in the upper half, so two thumbs met at
 * either end can always be pulled apart.
 */
export function connect<T = Dict>(props: RangeSliderProps, normalize: Normalizer<T>, options: RangeSliderConnectOptions = {}) {
  const { id, min = 0, max = 100, step = 1, minGap = 0, name, label, valueDisplay = 'header', prefix, suffix, marks, size = 'md', disabled, invalid } = props
  const { onValueChange, formatValue, words = {}, drafts = [null, null], onDraftChange } = options
  const ids = rangeSliderIds(id)
  const span = max > min ? max - min : 1
  const clampTo = (n: number) => Math.min(max, Math.max(min, n))
  const given = props.value ?? [min, max]
  const value: RangeValue = [clampTo(Math.min(given[0], given[1])), clampTo(Math.max(given[0], given[1]))]
  const at = (n: number) => Math.round(((n - min) / span) * 10000) / 10000
  const say = (n: number) => formatValue?.(n) ?? String(n)
  const between = words.between ?? ((a: string, b: string) => `${a} – ${b}`)
  const names: [string | undefined, string | undefined] = Array.isArray(name) ? name : [name, name]
  const thumbNames = [words.start ?? 'Minimum', words.end ?? 'Maximum'] as const
  const bounds = { min, max, step, minGap }

  const emit = (next: RangeValue) => {
    if (next[0] !== value[0] || next[1] !== value[1]) onValueChange?.(next)
  }

  const state = {
    'data-disabled': disabled ? '' : undefined,
    'data-invalid': invalid ? '' : undefined,
  }

  const thumbInput = (control: Element, index: 0 | 1) =>
    control.querySelectorAll<HTMLInputElement>("[data-scope='range-slider'][data-part='thumb']")[index] ?? null

  /** A press on the track: the nearer thumb goes there, takes the focus, and follows the pointer until it is let go. */
  const onPointerDown = (event: PointerEvent) => {
    if (disabled || event.button !== 0) return
    const control = event.currentTarget as HTMLElement
    if ((event.target as Element | null)?.closest?.("[data-part='thumb']")) return
    const rect = control.getBoundingClientRect()
    if (rect.width <= 0) return
    const valueAt = (x: number) => min + Math.min(1, Math.max(0, (x - rect.left) / rect.width)) * span
    const rtl = getComputedStyle(control).direction === 'rtl'
    const read = (x: number) => (rtl ? max + min - valueAt(x) : valueAt(x))
    const first = read(event.clientX)
    // Below the range, the lower thumb; above it, the upper; inside it, the nearer one.
    const index: 0 | 1 = first <= value[0] ? 0 : first >= value[1] ? 1 : first - value[0] < value[1] - first ? 0 : 1
    let current = placeEnd(value, index, first, bounds)
    emit(current)
    event.preventDefault()
    thumbInput(control, index)?.focus()
    const move = (next: PointerEvent) => {
      const placed = placeEnd(current, index, read(next.clientX), bounds)
      if (placed[index] !== current[index]) {
        current = placed
        onValueChange?.(placed)
      }
    }
    const stop = () => {
      control.removeEventListener('pointermove', move)
      control.removeEventListener('pointerup', stop)
      control.removeEventListener('pointercancel', stop)
    }
    try {
      control.setPointerCapture(event.pointerId)
    } catch {
      // A pointer the browser does not hold (a synthetic one) cannot be captured; the listeners below still follow it.
    }
    control.addEventListener('pointermove', move)
    control.addEventListener('pointerup', stop)
    control.addEventListener('pointercancel', stop)
  }

  const commit = (index: 0 | 1, text: string) => {
    onDraftChange?.(index, null)
    const typed = Number(text.trim().replace(',', '.'))
    if (text.trim() === '' || !Number.isFinite(typed)) return
    emit(placeEnd(value, index, typed, bounds))
  }

  const bubbles =
    at(value[1]) - at(value[0]) < MERGE
      ? [{ which: 'both' as const, text: value[0] === value[1] ? say(value[0]) : between(say(value[0]), say(value[1])) }]
      : [
          { which: 'start' as const, text: say(value[0]) },
          { which: 'end' as const, text: say(value[1]) },
        ]

  return {
    ids,
    value,
    valueDisplay,
    label,
    prefix,
    suffix,
    /** The range in words, for the header. */
    valueText: value[0] === value[1] ? say(value[0]) : between(say(value[0]), say(value[1])),
    bubbles,
    marks: sliderMarks(marks, min, max, formatValue),
    rootProps: normalize({
      ...anatomy.attrs('root'),
      ...state,
      id,
      role: 'group',
      'aria-labelledby': ids.label,
      'data-size': size,
      'data-display': valueDisplay,
      style: { '--gg-range-start': at(value[0]), '--gg-range-end': at(value[1]) },
    }),
    headerProps: normalize({ ...anatomy.attrs('header') }),
    labelProps: normalize({ ...anatomy.attrs('label'), id: ids.label, ...state }),
    /** Seen, not read: each thumb says its own value. */
    valueProps: normalize({ ...anatomy.attrs('value'), 'aria-hidden': 'true' }),
    bubblesProps: normalize({ ...anatomy.attrs('bubbles'), 'aria-hidden': 'true' }),
    getBubbleProps: (which: 'start' | 'end' | 'both') => normalize({ ...anatomy.attrs('bubble'), 'data-thumb': which }),
    controlProps: normalize({ ...anatomy.attrs('control'), ...state, onPointerDown }),
    trackProps: normalize({ ...anatomy.attrs('track'), 'aria-hidden': 'true' }),
    rangeProps: normalize({ ...anatomy.attrs('range'), 'aria-hidden': 'true' }),
    getThumbProps: (index: 0 | 1) =>
      normalize({
        ...anatomy.attrs('thumb'),
        ...state,
        type: 'range',
        min,
        max,
        step,
        value: String(value[index]),
        name: names[index],
        disabled: disabled || undefined,
        'aria-label': thumbNames[index],
        'aria-valuetext': formatValue ? say(value[index]) : undefined,
        'aria-invalid': invalid ? 'true' : undefined,
        'data-thumb': index === 0 ? 'start' : 'end',
        'data-front': index === 0 && value[0] >= min + span / 2 ? '' : undefined,
        onInput: (event: Event) => {
          const input = event.currentTarget as HTMLInputElement
          const next = placeEnd(value, index, Number(input.value), bounds)
          // Pushed past the other end, it stops there — and the input is told, since a state that did not change draws nothing.
          if (String(next[index]) !== input.value) input.value = String(next[index])
          emit(next)
        },
      }),
    marksProps: normalize({ ...anatomy.attrs('marks'), 'aria-hidden': 'true' }),
    getMarkProps: (mark: SliderMarkView) =>
      normalize({
        ...anatomy.attrs('mark'),
        'data-in-range': mark.value >= value[0] && mark.value <= value[1] ? '' : undefined,
        'data-edge': mark.edge,
        style: { '--gg-mark': Math.round(mark.at * 10000) / 10000 },
      }),
    fieldsProps: normalize({ ...anatomy.attrs('fields') }),
    separatorProps: normalize({ ...anatomy.attrs('separator'), 'aria-hidden': 'true' }),
    /** What a field shows: its draft while it is being typed in, else its end. */
    fieldText: (index: 0 | 1) => drafts[index] ?? String(value[index]),
    onFieldInput: (index: 0 | 1, text: string) => onDraftChange?.(index, text),
    /**
     * The rest of a field's props, laid onto the kit's Input: a number field
     * named for its end, committed when it is left or on Enter — so typing
     * "2" on the way to "25" does not throw the thumb about — and put back by
     * Escape. A commit is kept on the track, on the step, and on its side.
     */
    getFieldProps: (index: 0 | 1) => ({
      type: 'number' as const,
      inputMode: 'decimal' as const,
      min,
      max,
      step,
      disabled: disabled || undefined,
      'aria-label': thumbNames[index],
      'data-thumb': index === 0 ? 'start' : 'end',
      ...normalize({
        onFocusOut: (event: Event) => commit(index, (event.currentTarget as HTMLInputElement).value),
        onKeyDown: (event: KeyboardEvent) => {
          if (event.key === 'Enter') commit(index, (event.currentTarget as HTMLInputElement).value)
          else if (event.key === 'Escape' && drafts[index] !== null) {
            event.preventDefault()
            onDraftChange?.(index, null)
          }
        },
      }),
    }),
  }
}

export type RangeSliderApi<T = Dict> = ReturnType<typeof connect<T>>
