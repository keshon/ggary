import { createMachine, withEffects, type Machine } from '../../machine'
import { addDays, addMonths, clampDate, isISODate, startOfWeek, todayISO, weekStartOf, type ISODate } from '../../utils/calendar'
import type { CalendarEvent, CalendarOptions, CalendarState, DateRange } from './calendar.types'

export const EMPTY_RANGE: DateRange = { start: null, end: null }

/** A day that cannot be chosen: outside min and max, or refused by the owner. */
export function isUnavailable(state: Pick<CalendarState, 'min' | 'max' | 'isDateDisabled'>, date: ISODate): boolean {
  if (state.min && date < state.min) return true
  if (state.max && date > state.max) return true
  return state.isDateDisabled?.(date) ?? false
}

const withFocus = (state: CalendarState, date: ISODate): CalendarState => {
  const focused = clampDate(date, state.min, state.max)
  return focused === state.focused ? state : { ...state, focused }
}

/** A choice, as Select's: intent always, the value when the calendar owns it. */
function commit(state: CalendarState, value: DateRange): CalendarState {
  const next = { ...state, anchor: null, hovered: null, intent: { value, nonce: state.intent.nonce + 1 } }
  return state.controlled ? next : { ...next, value }
}

export function reducer(state: CalendarState, event: CalendarEvent): CalendarState {
  switch (event.type) {
    case 'FOCUS':
      return isISODate(event.date) ? withFocus(state, event.date) : state
    case 'MOVE':
      return withFocus(state, addDays(state.focused, event.days))
    case 'MOVE_MONTHS':
      return withFocus(state, addMonths(state.focused, event.months))
    case 'WEEK_EDGE': {
      const first = startOfWeek(state.focused, state.weekStart)
      return withFocus(state, event.edge === 'start' ? first : addDays(first, 6))
    }
    case 'SELECT': {
      const date = event.date ?? state.focused
      if (!isISODate(date) || isUnavailable(state, date)) return state
      const focused = { ...state, focused: date }
      if (state.mode === 'single') return commit(focused, { start: date, end: null })
      // The first press anchors the range; the second closes it, in either direction.
      if (state.anchor === null) return { ...focused, anchor: date, hovered: date }
      const [start, end] = date < state.anchor ? [date, state.anchor] : [state.anchor, date]
      return commit(focused, { start, end })
    }
    case 'HOVER':
      return event.date === state.hovered ? state : { ...state, hovered: event.date }
    case 'CLEAR':
      if (state.value.start === null && state.anchor === null) return state
      return commit(state, EMPTY_RANGE)
    case 'SET': {
      const { start, end } = event.value
      if (start === state.value.start && end === state.value.end && state.anchor === null) return state
      return commit(start ? withFocus(state, start) : state, { start, end })
    }
    case 'SYNC_VALUE': {
      const { start, end } = event.value
      if (start === state.value.start && end === state.value.end) return state
      return { ...state, value: { start, end }, anchor: null }
    }
    case 'SYNC_TODAY':
      return event.today === state.today ? state : { ...state, today: event.today }
    case 'SYNC_OPTIONS': {
      let next = state
      for (const key of ['mode', 'min', 'max', 'weekStart', 'isDateDisabled'] as const) {
        if (event[key] !== undefined && event[key] !== next[key]) next = { ...next, [key]: event[key] }
      }
      return next === state ? state : withFocus({ ...next, anchor: next.mode === state.mode ? next.anchor : null }, next.focused)
    }
  }
}

export interface CalendarConfig extends Partial<Omit<CalendarOptions, 'weekStart'>> {
  id: string
  /** The locale, for the week's first day when `weekStart` is not given. */
  locale?: string
  weekStart?: number
  /** Controlled. A single calendar takes a day; a range calendar `{ start, end }`. */
  value?: ISODate | DateRange | null
  defaultValue?: ISODate | DateRange | null
  /** The month to open on when nothing is chosen. Default today's. */
  defaultMonth?: ISODate
  today?: ISODate
  onValueChange?: (value: DateRange) => void
}

export const toRange = (value: ISODate | DateRange | null | undefined): DateRange =>
  value == null ? EMPTY_RANGE : typeof value === 'string' ? { start: value, end: null } : { start: value.start ?? null, end: value.end ?? null }

export function initialState(config: CalendarConfig): CalendarState {
  const controlled = config.value !== undefined
  const value = toRange(controlled ? config.value : config.defaultValue)
  const today = config.today ?? todayISO()
  const options: CalendarOptions = {
    mode: config.mode ?? 'single',
    min: config.min ?? null,
    max: config.max ?? null,
    weekStart: config.weekStart ?? weekStartOf(config.locale),
    isDateDisabled: config.isDateDisabled ?? null,
  }
  return {
    id: config.id,
    ...options,
    focused: clampDate(value.start ?? config.defaultMonth ?? today, options.min, options.max),
    today,
    value,
    anchor: null,
    hovered: null,
    controlled,
    intent: { value, nonce: 0 },
  }
}

export function createCalendarMachine(config: CalendarConfig): Machine<CalendarState, CalendarEvent> {
  const machine = createMachine(initialState(config), reducer)
  return withEffects(machine, (previous, next) => {
    if (previous.intent.nonce !== next.intent.nonce) config.onValueChange?.(next.intent.value)
  })
}
