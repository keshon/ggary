import { describe, expect, it } from 'vitest'
import {
  addDays,
  addMonths,
  dateOrder,
  formatLongDate,
  monthWeeks,
  parseISO,
  parseTypedDate,
  startOfWeek,
  weekStartOf,
  weekdayNames,
} from '../packages/core/src/utils/calendar'
import { connect as connectCalendar, createCalendarMachine, type CalendarConfig, type DateRange } from '../packages/core/src/components/calendar'
import { connect as connectDatePicker, createDatePickerMachine, type DatePickerConfig } from '../packages/core/src/components/date-picker'

/**
 * Days on a wall calendar, with no DOM and no time zone: the arithmetic,
 * a month's page, the locale's week and names, and a day typed in the
 * locale's own order.
 */

describe('days', () => {
  it('only a real day is a day', () => {
    expect(parseISO('2026-02-29')).toBeNull()
    expect(parseISO('2024-02-29')).toEqual({ year: 2024, month: 2, day: 29 })
    expect(parseISO('2026-04-31')).toBeNull()
    expect(parseISO('18.09.2026')).toBeNull()
  })

  it('adds days across a month, a year and a clock change without losing one', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30')
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('a month on keeps the day where it can, and the last day where it cannot', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29')
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-15')
    expect(addMonths('2026-01-15', -13)).toBe('2024-12-15')
  })

  it('a month’s page is six weeks from the week of its first day', () => {
    const weeks = monthWeeks('2026-09-18', 1)
    expect(weeks).toHaveLength(6)
    expect(weeks[0][0]).toBe('2026-08-31')
    expect(weeks[0][1]).toBe('2026-09-01')
    expect(monthWeeks('2026-09-18', 0)[0][0]).toBe('2026-08-30')
    expect(startOfWeek('2026-09-20', 1)).toBe('2026-09-14')
  })
})

describe('the locale', () => {
  it('starts the week where its people do', () => {
    expect(weekStartOf('ru-RU')).toBe(1)
    expect(weekStartOf('de-DE')).toBe(1)
    expect(weekStartOf('en-US')).toBe(0)
  })

  it('names the weekdays from the week’s first day', () => {
    expect(weekdayNames('en-US', 1).map((day) => day.short)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
    expect(weekdayNames('en-US', 0)[0].long).toBe('Sunday')
    expect(formatLongDate('2026-09-18', 'en-US')).toBe('Friday, September 18, 2026')
  })

  it('knows the order its dates are written in', () => {
    expect(dateOrder('en-US')).toEqual(['month', 'day', 'year'])
    expect(dateOrder('ru-RU')).toEqual(['day', 'month', 'year'])
  })
})

describe('a typed day', () => {
  it('reads numbers in the locale’s order', () => {
    expect(parseTypedDate('18.09.2026', 'ru-RU')).toBe('2026-09-18')
    expect(parseTypedDate('9/18/2026', 'en-US')).toBe('2026-09-18')
    expect(parseTypedDate('9/18/26', 'en-US')).toBe('2026-09-18')
    expect(parseTypedDate('2026-09-18', 'en-US')).toBe('2026-09-18')
    expect(parseTypedDate('2026.09.18', 'ru-RU')).toBe('2026-09-18')
  })

  it('reads a month written in words, in the locale’s language and its genitive', () => {
    expect(parseTypedDate('18 Sep 2026', 'en-US')).toBe('2026-09-18')
    expect(parseTypedDate('September 18, 2026', 'en-US')).toBe('2026-09-18')
    expect(parseTypedDate('18 сентября 2026', 'ru-RU')).toBe('2026-09-18')
    expect(parseTypedDate('18 сент. 2026', 'ru-RU')).toBe('2026-09-18')
  })

  it('refuses what is not one day', () => {
    expect(parseTypedDate('31.02.2026', 'ru-RU')).toBeNull()
    expect(parseTypedDate('soon', 'en-US')).toBeNull()
    expect(parseTypedDate('18.09', 'ru-RU')).toBeNull()
    expect(parseTypedDate('', 'ru-RU')).toBeNull()
  })
})

describe('the calendar', () => {
  const same = (props: Record<string, unknown>) => props
  const calendar = (config: Partial<CalendarConfig> = {}) => {
    const values: DateRange[] = []
    const machine = createCalendarMachine({ id: 'c', locale: 'en-GB', today: '2026-09-18', onValueChange: (value) => values.push(value), ...config })
    const api = () => connectCalendar(machine.getState(), machine.send, same, { locale: 'en-GB' })
    return { machine, api, values }
  }

  it('opens on today’s month, one tab stop on today, named in full', () => {
    const { api } = calendar()
    expect(api().title).toBe('September 2026')
    expect(api().weeks[0][0]).toBe('2026-08-31')
    const today = api().getDayProps('2026-09-18')
    expect(today).toMatchObject({ tabIndex: 0, 'aria-current': 'date', 'aria-label': 'Friday, 18 September 2026' })
    expect(api().getDayProps('2026-09-17').tabIndex).toBe(-1)
    expect(api().getDayProps('2026-08-31')['data-outside']).toBe('')
  })

  it('the keyboard walks days, weeks, the week’s ends, months and years, and crosses into the next month', () => {
    const { machine, api } = calendar()
    const key = (name: string, shiftKey = false) =>
      (api().gridProps.onKeyDown as (e: unknown) => void)({ key: name, shiftKey, preventDefault() {}, currentTarget: null })
    key('ArrowDown')
    key('ArrowDown')
    expect(machine.getState().focused).toBe('2026-10-02')
    expect(api().title).toBe('October 2026')
    key('Home')
    expect(machine.getState().focused).toBe('2026-09-28')
    key('End')
    expect(machine.getState().focused).toBe('2026-10-04')
    key('PageDown')
    expect(machine.getState().focused).toBe('2026-11-04')
    key('PageUp', true)
    expect(machine.getState().focused).toBe('2025-11-04')
  })

  it('stays within min and max, and a refused day cannot be chosen', () => {
    const { machine, api, values } = calendar({ min: '2026-09-10', max: '2026-09-25', isDateDisabled: (date) => date === '2026-09-19' })
    machine.send({ type: 'MOVE_MONTHS', months: 1 })
    expect(machine.getState().focused).toBe('2026-09-25')
    expect(api().nextProps.disabled).toBe(true)
    expect(api().getDayProps('2026-09-19')['aria-disabled']).toBe('true')
    machine.send({ type: 'SELECT', date: '2026-09-19' })
    machine.send({ type: 'SELECT', date: '2026-09-05' })
    expect(values).toEqual([])
    machine.send({ type: 'SELECT', date: '2026-09-20' })
    expect(values).toEqual([{ start: '2026-09-20', end: null }])
  })

  it('a range takes two presses in either order, and shows the one a second press would make', () => {
    const { machine, api, values } = calendar({ mode: 'range' })
    machine.send({ type: 'SELECT', date: '2026-09-20' })
    machine.send({ type: 'HOVER', date: '2026-09-15' })
    expect(api().getDayProps('2026-09-17')).toMatchObject({ 'data-in-range': '', 'data-preview': '' })
    expect(api().getDayProps('2026-09-15')['data-range-start']).toBe('')
    machine.send({ type: 'SELECT', date: '2026-09-15' })
    expect(values).toEqual([{ start: '2026-09-15', end: '2026-09-20' }])
    expect(api().getDayProps('2026-09-17')['data-preview']).toBeUndefined()
    expect(api().getDayProps('2026-09-17')['aria-selected']).toBe('true')
  })
})

describe('the date picker', () => {
  const same = (props: Record<string, unknown>) => props
  const picker = (config: Partial<DatePickerConfig> = {}) => {
    const values: DateRange[] = []
    const machine = createDatePickerMachine({ id: 'd', locale: 'ru-RU', today: '2026-09-18', onValueChange: (value) => values.push(value), ...config })
    const api = () => connectDatePicker(machine.getState(), machine.send, same)
    return { machine, api, values }
  }

  it('a day typed in the locale’s order is chosen on Enter and shown in the locale’s words', () => {
    const { machine, api, values } = picker()
    machine.send({ type: 'INPUT', text: '1.10.2026' })
    ;(api().inputProps.onKeyDown as (e: unknown) => void)({ key: 'Enter', preventDefault() {} })
    expect(values).toEqual([{ start: '2026-10-01', end: null }])
    expect(api().inputProps.value).toBe('1 окт. 2026 г.')
    expect(api().hiddenInputProps.value).toBe('2026-10-01')
  })

  it('text that is not a day is marked, and says how to write one', () => {
    const { machine, api, values } = picker({ max: '2026-12-31' })
    machine.send({ type: 'INPUT', text: 'someday' })
    machine.send({ type: 'COMMIT_TEXT' })
    expect(api().inputProps['aria-invalid']).toBe('true')
    expect(api().errorText).toBe('Enter a date like 18.09.2026')
    machine.send({ type: 'INPUT', text: '1.01.2027' })
    machine.send({ type: 'COMMIT_TEXT' })
    expect(api().invalid).toBe(true)
    expect(values).toEqual([])
  })

  it('opens on the chosen day, and choosing in the calendar closes it', () => {
    const { machine, api, values } = picker({ defaultValue: '2026-07-04' })
    machine.send({ type: 'OPEN' })
    expect(machine.getState().calendar.focused).toBe('2026-07-04')
    expect(api().triggerProps['aria-expanded']).toBe('true')
    machine.send({ type: 'CALENDAR', event: { type: 'SELECT', date: '2026-07-10' } })
    expect(machine.getState().open).toBe(false)
    expect(values).toEqual([{ start: '2026-07-10', end: null }])
  })

  it('a range: typed as two days, submitted as an ISO interval; the calendar stays open for the second press', () => {
    const { machine, api, values } = picker({ mode: 'range', locale: 'en-US' })
    machine.send({ type: 'INPUT', text: '9/18/2026 – 9/1/2026' })
    machine.send({ type: 'COMMIT_TEXT' })
    expect(values).toEqual([{ start: '2026-09-01', end: '2026-09-18' }])
    expect(api().inputProps.value).toBe('Sep 1, 2026 – Sep 18, 2026')
    expect(api().hiddenInputProps.value).toBe('2026-09-01/2026-09-18')
    machine.send({ type: 'OPEN' })
    machine.send({ type: 'CALENDAR', event: { type: 'SELECT', date: '2026-10-01' } })
    expect(machine.getState().open).toBe(true)
    machine.send({ type: 'CALENDAR', event: { type: 'SELECT', date: '2026-10-05' } })
    expect(machine.getState().open).toBe(false)
  })

  it('an emptied field clears the choice', () => {
    const { machine, values } = picker({ defaultValue: '2026-07-04' })
    machine.send({ type: 'INPUT', text: '' })
    machine.send({ type: 'COMMIT_TEXT' })
    expect(values).toEqual([{ start: null, end: null }])
  })
})
