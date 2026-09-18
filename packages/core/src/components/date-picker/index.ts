import type { IconName } from '@ggary/icons'
import { createMachine, withEffects, type Machine } from '../../machine'
import { createAnatomy, type Dict, type Normalizer } from '../../types'
import { addDays, addMonths, clampDate, dateOrder, formatDate, parseTypedDate, startOfMonth, todayISO, type ISODate } from '../../utils/calendar'
import { connect as connectCalendar, type CalendarWords } from '../calendar/calendar.connect'
import { initialState as initialCalendar, isUnavailable, reducer as calendarReducer, EMPTY_RANGE, type CalendarConfig } from '../calendar/calendar.machine'
import type { CalendarEvent, CalendarOptions, CalendarState, DateRange } from '../calendar/calendar.types'

/**
 * A field for a day, or for a range of days, with a calendar behind a button.
 * The field is the quick way — type "18.09.2026" or "18 Sep" in the locale's
 * own order and press Enter or move on — and the calendar is the browsing way.
 * Both commit through the calendar, so a typed day and a pressed one are the
 * same choice, with the same min, max and disabled days.
 *
 * The calendar opens in a non-modal dialog under the field, with the focus on
 * the chosen day (or today). Choosing closes it and brings the focus back to
 * the field; Escape and a press outside do the same without choosing.
 */

export const datePickerAnatomy = createAnatomy('date-picker', [
  'root',
  'label',
  'control',
  'input',
  'trigger',
  'trigger-icon',
  'positioner',
  'content',
  'presets',
  'preset',
  'error',
] as const)
export type DatePickerPart = (typeof datePickerAnatomy.parts)[number]

export interface DatePickerState {
  id: string
  locale: string | undefined
  open: boolean
  /** What is typed, while the person is typing. */
  text: string
  editing: boolean
  /** The typed text is not a day that can be chosen. */
  invalid: boolean
  calendar: CalendarState
}

export type DatePickerEvent =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'TOGGLE' }
  | { type: 'INPUT'; text: string }
  | { type: 'COMMIT_TEXT' }
  | { type: 'CALENDAR'; event: CalendarEvent }
  | { type: 'SYNC_VALUE'; value: DateRange }
  | ({ type: 'SYNC_OPTIONS'; locale?: string } & Partial<CalendarOptions>)

/** A choice made in one press beside the calendar: "Last 7 days". Its value may depend on today. */
export interface DatePreset {
  label: string
  value: DateRange | ((today: ISODate) => DateRange)
}

export interface RangePresetWords {
  today?: string
  yesterday?: string
  last7?: string
  last30?: string
  thisMonth?: string
  lastMonth?: string
}

/**
 * The ranges a report asks for most: today, yesterday, the last 7 and 30
 * days (today included), this month so far, and the whole of last month.
 */
export function rangePresets(words: RangePresetWords = {}): DatePreset[] {
  const endOfMonth = (iso: ISODate) => addDays(startOfMonth(addMonths(startOfMonth(iso), 1)), -1)
  return [
    { label: words.today ?? 'Today', value: (today) => ({ start: today, end: today }) },
    { label: words.yesterday ?? 'Yesterday', value: (today) => ({ start: addDays(today, -1), end: addDays(today, -1) }) },
    { label: words.last7 ?? 'Last 7 days', value: (today) => ({ start: addDays(today, -6), end: today }) },
    { label: words.last30 ?? 'Last 30 days', value: (today) => ({ start: addDays(today, -29), end: today }) },
    { label: words.thisMonth ?? 'This month', value: (today) => ({ start: startOfMonth(today), end: today }) },
    { label: words.lastMonth ?? 'Last month', value: (today) => ({ start: startOfMonth(addMonths(startOfMonth(today), -1)), end: endOfMonth(addMonths(startOfMonth(today), -1)) }) },
  ]
}

/** What stands in the field when nobody is typing: the chosen day, or range, in the locale's words. */
export function displayValue(value: DateRange, mode: CalendarState['mode'], locale?: string): string {
  if (!value.start) return ''
  if (mode === 'single' || !value.end) return formatDate(value.start, locale)
  return `${formatDate(value.start, locale)} – ${formatDate(value.end, locale)}`
}

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

export const datePickerIds = (id: string) => ({
  root: id,
  label: `${id}-label`,
  input: `${id}-input`,
  trigger: `${id}-trigger`,
  content: `${id}-content`,
  error: `${id}-error`,
})

export interface DatePickerWords extends CalendarWords {
  placeholder?: string
  /** The calendar button's name. */
  choose?: string
  /** Said under a field whose text is not a day: receives an example in the locale's order. */
  invalid?: (example: string) => string
}

export interface DatePickerConnectOptions extends DatePickerWords {
  /** Choices made in one press beside the calendar. `rangePresets()` gives the usual ones. */
  presets?: DatePreset[]
  /** The presets' name. Default "Presets". */
  presetsLabel?: string
  /** Submits the day as `YYYY-MM-DD`, a range as `YYYY-MM-DD/YYYY-MM-DD` — an ISO 8601 interval. */
  name?: string
  form?: string
}

/** A day written the way the locale writes it in numbers: "18.09.2026", "9/18/2026". */
export function exampleDate(locale?: string): string {
  const numbers: Record<string, string> = { day: '18', month: '09', year: '2026' }
  const order = dateOrder(locale)
  const separator = formatDate('2026-09-18', locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\d/g, '').charAt(0) || '.'
  return order.map((part) => numbers[part]).join(separator)
}

export function connect<T = Dict>(state: DatePickerState, send: (event: DatePickerEvent) => void, normalize: Normalizer<T>, options: DatePickerConnectOptions = {}) {
  const ids = datePickerIds(state.id)
  const anatomy = datePickerAnatomy
  const locale = options.locale ?? state.locale
  const value = state.calendar.value
  const range = state.calendar.mode === 'range'
  const shown = state.editing ? state.text : displayValue(value, state.calendar.mode, locale)
  const example = range ? `${exampleDate(locale)} – ${exampleDate(locale)}` : exampleDate(locale)
  const calendar = connectCalendar(state.calendar, (event) => send({ type: 'CALENDAR', event }), normalize, { ...options, locale })

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && state.editing) {
      // A typed day is committed, not the form submitted.
      event.preventDefault()
      send({ type: 'COMMIT_TEXT' })
    } else if (event.key === 'ArrowDown' && (event.altKey || !state.editing)) {
      event.preventDefault()
      send({ type: 'OPEN' })
    } else if (event.key === 'Escape' && state.editing) {
      event.preventDefault()
      send({ type: 'INPUT', text: displayValue(value, state.calendar.mode, locale) })
      send({ type: 'COMMIT_TEXT' })
    }
  }

  const submitted = !value.start ? '' : range && value.end ? `${value.start}/${value.end}` : value.start

  return {
    ids,
    open: state.open,
    value,
    invalid: state.invalid,
    calendar,
    today: todayISO(),
    errorText: state.invalid ? (options.invalid ?? ((sample: string) => `Enter a date like ${sample}`))(example) : '',
    rootProps: normalize({
      ...anatomy.attrs('root'),
      id: ids.root,
      'data-state': state.open ? 'open' : 'closed',
      'data-mode': state.calendar.mode,
      'data-invalid': state.invalid ? '' : undefined,
    }),
    labelProps: normalize({ ...anatomy.attrs('label'), id: ids.label, htmlFor: ids.input }),
    controlProps: normalize({ ...anatomy.attrs('control'), 'data-state': state.open ? 'open' : 'closed', 'data-invalid': state.invalid ? '' : undefined }),
    inputProps: normalize({
      ...anatomy.attrs('input'),
      id: ids.input,
      type: 'text',
      autoComplete: 'off',
      spellCheck: false,
      placeholder: options.placeholder ?? example,
      value: shown,
      'aria-invalid': state.invalid ? 'true' : undefined,
      'aria-describedby': state.invalid ? ids.error : undefined,
      onInput: (event: Event) => send({ type: 'INPUT', text: (event.currentTarget as HTMLInputElement).value }),
      onKeyDown,
      onBlur: () => send({ type: 'COMMIT_TEXT' }),
    }),
    triggerProps: normalize({
      ...anatomy.attrs('trigger'),
      id: ids.trigger,
      type: 'button',
      'aria-label': options.choose ?? (range ? 'Choose dates' : 'Choose date'),
      'aria-haspopup': 'dialog',
      'aria-expanded': state.open ? 'true' : 'false',
      'aria-controls': ids.content,
      'data-state': state.open ? 'open' : 'closed',
      onClick: () => send({ type: 'TOGGLE' }),
    }),
    triggerIconProps: normalize({ ...anatomy.attrs('trigger-icon'), 'aria-hidden': 'true', 'data-icon': 'calendar' satisfies IconName }),
    positionerProps: normalize({ ...anatomy.attrs('positioner'), popover: 'manual', 'data-state': state.open ? 'open' : 'closed' }),
    contentProps: normalize({
      ...anatomy.attrs('content'),
      id: ids.content,
      role: 'dialog',
      'aria-modal': 'false',
      'aria-labelledby': calendar.ids.title,
      'data-state': state.open ? 'open' : 'closed',
    }),
    /** The presets, each with the range it stands for today. */
    presets: (options.presets ?? []).map((preset) => ({ preset, range: typeof preset.value === 'function' ? preset.value(state.calendar.today) : preset.value })),
    presetsProps: normalize({ ...anatomy.attrs('presets'), role: 'group', 'aria-label': options.presetsLabel ?? 'Presets' }),
    getPresetProps: (preset: DatePreset) => {
      const chosen = typeof preset.value === 'function' ? preset.value(state.calendar.today) : preset.value
      const refused = !chosen.start || [chosen.start, chosen.end].some((date) => date !== null && isUnavailable(state.calendar, date))
      const current = chosen.start === value.start && (chosen.end ?? null) === (value.end ?? null)
      return normalize({
        ...anatomy.attrs('preset'),
        type: 'button',
        'aria-pressed': current ? 'true' : 'false',
        disabled: refused || undefined,
        'data-current': current ? '' : undefined,
        onClick: () => {
          send({ type: 'CALENDAR', event: { type: 'SET', value: range ? chosen : { start: chosen.start, end: null } } })
          // The same range again is no change, and still the end of the visit.
          send({ type: 'CLOSE' })
        },
      })
    },
    errorProps: normalize({ ...anatomy.attrs('error'), id: ids.error }),
    hiddenInputProps: normalize({ type: 'hidden', name: options.name, form: options.form, value: submitted }),
    close: () => send({ type: 'CLOSE' }),
    clear: () => send({ type: 'CALENDAR', event: { type: 'CLEAR' } }),
    setValue: (next: DateRange) => send({ type: 'SYNC_VALUE', value: next }),
  }
}

export type DatePickerApi<T = Dict> = ReturnType<typeof connect<T>>
export { EMPTY_RANGE }
