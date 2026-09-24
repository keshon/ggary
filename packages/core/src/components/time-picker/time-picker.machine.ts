import { createMachine, withEffects, type Machine } from '../../machine'
import { isISOTime, minutesOf, nearestTime, parseTypedTime, timeSteps, type ISOTime } from '../../utils/time'
import type { TimePickerEvent, TimePickerOptions, TimePickerState } from './time-picker.types'

export const DEFAULTS: TimePickerOptions = { step: 15, min: null, max: null }

/** The times the list holds. */
export const timesOf = (state: Pick<TimePickerState, 'step' | 'min' | 'max'>) => timeSteps(state.step, state.min, state.max)

/** Outside min and max, or refused by the owner. */
export function isUnavailable(state: TimePickerState, time: ISOTime): boolean {
  const m = minutesOf(time)
  if (state.min && m < minutesOf(state.min)) return true
  if (state.max && m > minutesOf(state.max)) return true
  return state.isTimeDisabled?.(time) ?? false
}

const PAGE = 4

/** Where a list opens: on the value, or the time typed, or the time now — the nearest of the list's to it. */
function landing(state: TimePickerState, now: ISOTime | undefined): ISOTime | null {
  const times = timesOf(state)
  const typed = state.editing ? parseTypedTime(state.text, state.locale) : null
  const near = typed ?? state.value ?? now ?? null
  return near ? nearestTime(times, near) : (times[0] ?? null)
}

function choose(state: TimePickerState, time: ISOTime | null): TimePickerState {
  return {
    ...state,
    value: time,
    open: false,
    editing: false,
    invalid: false,
    text: '',
    highlighted: time ?? state.highlighted,
    intent: { value: time, nonce: state.intent.nonce + 1 },
  }
}

export function reducer(state: TimePickerState, event: TimePickerEvent): TimePickerState {
  switch (event.type) {
    case 'OPEN':
      return state.open ? state : { ...state, open: true, highlighted: landing(state, event.now) }
    case 'CLOSE':
      return state.open ? { ...state, open: false } : state
    case 'TOGGLE':
      return reducer(state, state.open ? { type: 'CLOSE' } : { type: 'OPEN', now: event.now })
    case 'INPUT': {
      // The list opens as the person types and stands on the nearest time to what they typed.
      const typed = parseTypedTime(event.text, state.locale)
      const highlighted = typed ? nearestTime(timesOf(state), typed) : state.highlighted
      return { ...state, text: event.text, editing: true, invalid: false, open: true, highlighted }
    }
    case 'COMMIT_TEXT': {
      if (!state.editing) return state.open ? { ...state, open: false } : state
      const text = state.text.trim()
      if (text === '') return state.value === null ? { ...state, editing: false, invalid: false, open: false } : choose(state, null)
      const time = parseTypedTime(text, state.locale)
      if (!time || isUnavailable(state, time)) return { ...state, invalid: true, open: false }
      return time === state.value ? { ...state, editing: false, invalid: false, open: false, text: '' } : choose(state, time)
    }
    case 'HIGHLIGHT':
      return state.highlighted === event.time ? state : { ...state, highlighted: event.time }
    case 'MOVE': {
      if (!state.open) return { ...state, open: true, editing: false, invalid: false, highlighted: landing(state, event.now) }
      const times = timesOf(state)
      if (times.length === 0) return state
      const at = state.highlighted ? times.indexOf(state.highlighted) : -1
      const index =
        event.by === 'first' ? 0
        : event.by === 'last' ? times.length - 1
        : event.by === 'next' ? Math.min(times.length - 1, at + 1)
        : event.by === 'previous' ? Math.max(0, at < 0 ? 0 : at - 1)
        : event.by === 'page-down' ? Math.min(times.length - 1, at + PAGE)
        : Math.max(0, at - PAGE)
      // Walking the list leaves what was typed: Enter now chooses the time walked to.
      return { ...state, editing: false, invalid: false, text: '', highlighted: times[index] }
    }
    case 'CHOOSE':
      return isUnavailable(state, event.time) ? state : choose(state, event.time)
    case 'CLEAR':
      return state.value === null ? state : choose(state, null)
    case 'SYNC_VALUE': {
      const value = isISOTime(event.value) ? event.value : null
      return value === state.value ? state : { ...state, value }
    }
    case 'SYNC_OPTIONS': {
      const next = { ...state }
      let changed = false
      for (const key of ['step', 'min', 'max'] as const) {
        const value = event[key] ?? DEFAULTS[key]
        if (next[key] !== value) {
          ;(next as Record<string, unknown>)[key] = value
          changed = true
        }
      }
      if (event.locale !== undefined && event.locale !== state.locale) {
        next.locale = event.locale
        changed = true
      }
      if (event.isTimeDisabled !== state.isTimeDisabled) {
        next.isTimeDisabled = event.isTimeDisabled
        changed = true
      }
      return changed ? next : state
    }
  }
}

export interface TimePickerConfig extends Partial<TimePickerOptions> {
  id: string
  locale?: string
  value?: ISOTime | null
  defaultValue?: ISOTime | null
  isTimeDisabled?: (time: ISOTime) => boolean
  onValueChange?: (value: ISOTime | null) => void
  onOpenChange?: (open: boolean) => void
}

export function initialState(config: TimePickerConfig): TimePickerState {
  const given = config.value !== undefined ? config.value : config.defaultValue
  const value = isISOTime(given) ? given : null
  return {
    id: config.id,
    locale: config.locale,
    step: config.step ?? DEFAULTS.step,
    min: config.min ?? DEFAULTS.min,
    max: config.max ?? DEFAULTS.max,
    isTimeDisabled: config.isTimeDisabled,
    value,
    open: false,
    text: '',
    editing: false,
    invalid: false,
    highlighted: value,
    intent: { value, nonce: 0 },
  }
}

export function createTimePickerMachine(config: TimePickerConfig): Machine<TimePickerState, TimePickerEvent> {
  const machine = createMachine(initialState(config), reducer)
  return withEffects(machine, (previous, next) => {
    if (previous.open !== next.open) config.onOpenChange?.(next.open)
    if (previous.intent.nonce !== next.intent.nonce) config.onValueChange?.(next.intent.value)
  })
}
