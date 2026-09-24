import { createMachine, withEffects, type Machine } from '../../machine'
import { clampDate, parseTypedDate } from '../../utils/calendar'
import { initialState as initialCalendar, isUnavailable, reducer as calendarReducer, type CalendarConfig } from '../calendar/calendar.machine'
import type { DateRange } from '../calendar/calendar.types'
import type { DatePickerEvent, DatePickerState } from './date-picker.types'

/** A range typed as two days: "1.09.2026 – 18.09.2026", "Sep 1 - Sep 18 2026", "2026-09-01/2026-09-18". */
function parseTypedRange(text: string, locale?: string): DateRange | null {
  const parts = text.split(/\s+[-–—]\s+|\s*[–—]\s*|\s*\.\.\s*|\//).filter((part) => part.trim() !== '')
  // "9/1/2026 – 9/18/2026": the slash was a date's, not the range's.
  const pieces = parts.length === 2 ? parts : text.split(/\s+[-–—]\s+|\s*[–—]\s*|\s*\.\.\s*/)
  if (pieces.length !== 2) return null
  const start = parseTypedDate(pieces[0], locale)
  const end = parseTypedDate(pieces[1], locale)
  if (!start || !end) return null
  return start <= end ? { start, end } : { start: end, end: start }
}

const closedState = (state: DatePickerState): DatePickerState => ({
  ...state,
  open: false,
  calendar: state.calendar.anchor === null && state.calendar.hovered === null ? state.calendar : { ...state.calendar, anchor: null, hovered: null },
})

export function reducer(state: DatePickerState, event: DatePickerEvent): DatePickerState {
  switch (event.type) {
    case 'OPEN': {
      if (state.open) return state
      const start = state.calendar.value.start ?? state.calendar.today
      const calendar = calendarReducer(state.calendar, { type: 'FOCUS', date: clampDate(start, state.calendar.min, state.calendar.max) })
      return { ...state, open: true, calendar }
    }
    case 'CLOSE':
      return state.open ? closedState(state) : state
    case 'TOGGLE':
      return reducer(state, { type: state.open ? 'CLOSE' : 'OPEN' })
    case 'INPUT':
      return { ...state, text: event.text, editing: true, invalid: false }
    case 'COMMIT_TEXT': {
      if (!state.editing) return state
      const text = state.text.trim()
      const done = { ...state, editing: false, invalid: false }
      if (text === '') return { ...done, calendar: calendarReducer(state.calendar, { type: 'CLEAR' }) }
      const range: DateRange | null =
        state.calendar.mode === 'single'
          ? ((date) => (date ? { start: date, end: null } : null))(parseTypedDate(text, state.locale))
          : parseTypedRange(text, state.locale)
      const refused = !range || [range.start, range.end].some((date) => date !== null && isUnavailable(state.calendar, date))
      if (refused) return { ...state, invalid: true }
      return { ...done, calendar: calendarReducer(state.calendar, { type: 'SET', value: range }) }
    }
    case 'CALENDAR': {
      const calendar = calendarReducer(state.calendar, event.event)
      if (calendar === state.calendar) return state
      const chosen = calendar.intent.nonce !== state.calendar.intent.nonce
      const next = { ...state, calendar, ...(chosen ? { editing: false, invalid: false, text: '' } : {}) }
      // A day chosen, or a range closed, is the end of the visit.
      return chosen ? closedState(next) : next
    }
    case 'SYNC_VALUE':
      return { ...state, calendar: calendarReducer(state.calendar, { type: 'SYNC_VALUE', value: event.value }) }
    case 'SYNC_OPTIONS': {
      const { type: _type, locale, ...options } = event
      const calendar = calendarReducer(state.calendar, { type: 'SYNC_OPTIONS', ...options })
      const withLocale = locale !== undefined && locale !== state.locale ? { ...state, locale } : state
      return calendar === state.calendar ? withLocale : { ...withLocale, calendar }
    }
  }
}

export interface DatePickerConfig extends CalendarConfig {
  onOpenChange?: (open: boolean) => void
}

export function initialState(config: DatePickerConfig): DatePickerState {
  return { id: config.id, locale: config.locale, open: false, text: '', editing: false, invalid: false, calendar: initialCalendar({ ...config, id: `${config.id}-calendar` }) }
}

export function createDatePickerMachine(config: DatePickerConfig): Machine<DatePickerState, DatePickerEvent> {
  const machine = createMachine(initialState(config), reducer)
  return withEffects(machine, (previous, next) => {
    if (previous.open !== next.open) config.onOpenChange?.(next.open)
    if (previous.calendar.intent.nonce !== next.calendar.intent.nonce) config.onValueChange?.(next.calendar.intent.value)
  })
}
