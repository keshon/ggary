import type { IconName } from '@ggary/icons'
import type { Dict, Normalizer } from '../../types'
import { addMonths, formatLongDate, formatMonth, monthWeeks, sameMonth, startOfMonth, weekdayNames, type ISODate } from '../../utils/calendar'
import { calendarAnatomy as anatomy } from './calendar.anatomy'
import { isUnavailable } from './calendar.machine'
import type { CalendarEvent, CalendarState } from './calendar.types'

export const calendarIds = (id: string) => ({
  root: id,
  title: `${id}-title`,
  grid: `${id}-grid`,
  day: (date: ISODate) => `${id}-day-${date}`,
})

export interface CalendarWords {
  locale?: string
  previousMonth?: string
  nextMonth?: string
}

/**
 * A month as a grid of days — the date grid of the ARIA practices. One tab
 * stop: the focused day. Arrows move a day or a week, Home and End go to the
 * ends of the week, PageUp and PageDown a month (Shift, a year), Enter and
 * Space choose. The focus crosses into the next month by itself; the title,
 * a polite live region, says which month is shown now.
 *
 * Each day is named in full — "Friday, 18 September 2026" — since a lone "18"
 * in a grid says little. Today is `aria-current="date"`; a day outside min and
 * max, or refused by the owner, is `aria-disabled` and stays reachable, so the
 * arrows do not jump over it without a word.
 *
 * A range is chosen by two presses, in either order; between them the days up
 * to the pointer or the focused day show the range a second press would make.
 */
export function connect<T = Dict>(state: CalendarState, send: (event: CalendarEvent) => void, normalize: Normalizer<T>, options: CalendarWords = {}) {
  const words = options
  const ids = calendarIds(state.id)
  const locale = words.locale
  const month = startOfMonth(state.focused)
  const weeks = monthWeeks(month, state.weekStart)

  // The range drawn: the chosen one, or the one a second press would make.
  const pendingEnd = state.anchor !== null ? (state.hovered ?? state.focused) : null
  const [rangeStart, rangeEnd] =
    state.anchor !== null && pendingEnd !== null
      ? pendingEnd < state.anchor
        ? [pendingEnd, state.anchor]
        : [state.anchor, pendingEnd]
      : [state.value.start, state.value.end]

  const prevMonth = addMonths(month, -1)
  const nextMonth = addMonths(month, 1)
  const canPrev = !state.min || prevMonth.slice(0, 7) >= state.min.slice(0, 7)
  const canNext = !state.max || nextMonth.slice(0, 7) <= state.max.slice(0, 7)

  const onKeyDown = (event: KeyboardEvent) => {
    const target = event.currentTarget
    const rtl = typeof Element !== 'undefined' && target instanceof Element && getComputedStyle(target).direction === 'rtl'
    const sideways = rtl ? -1 : 1
    switch (event.key) {
      case 'ArrowRight':
        send({ type: 'MOVE', days: sideways })
        break
      case 'ArrowLeft':
        send({ type: 'MOVE', days: -sideways })
        break
      case 'ArrowDown':
        send({ type: 'MOVE', days: 7 })
        break
      case 'ArrowUp':
        send({ type: 'MOVE', days: -7 })
        break
      case 'Home':
        send({ type: 'WEEK_EDGE', edge: 'start' })
        break
      case 'End':
        send({ type: 'WEEK_EDGE', edge: 'end' })
        break
      case 'PageDown':
        send({ type: 'MOVE_MONTHS', months: event.shiftKey ? 12 : 1 })
        break
      case 'PageUp':
        send({ type: 'MOVE_MONTHS', months: event.shiftKey ? -12 : -1 })
        break
      case 'Enter':
      case ' ':
        send({ type: 'SELECT' })
        break
      default:
        return
    }
    // Only a key the grid acted on: a Tab out must not pull the focus back in later.
    if (typeof Element !== 'undefined' && target instanceof Element) movedByKeyboard.add(target)
    event.preventDefault()
  }

  const weekdays = weekdayNames(locale, state.weekStart)

  return {
    ids,
    month,
    title: formatMonth(month, locale),
    focusedId: ids.day(state.focused),
    weeks,
    weekdays,
    rootProps: normalize({ ...anatomy.attrs('root'), id: ids.root, 'data-mode': state.mode }),
    headerProps: normalize({ ...anatomy.attrs('header') }),
    titleProps: normalize({ ...anatomy.attrs('title'), id: ids.title, 'aria-live': 'polite' }),
    prevProps: normalize({
      ...anatomy.attrs('prev'),
      type: 'button',
      'aria-label': words.previousMonth ?? 'Previous month',
      disabled: canPrev ? undefined : true,
      onClick: () => send({ type: 'MOVE_MONTHS', months: -1 }),
    }),
    nextProps: normalize({
      ...anatomy.attrs('next'),
      type: 'button',
      'aria-label': words.nextMonth ?? 'Next month',
      disabled: canNext ? undefined : true,
      onClick: () => send({ type: 'MOVE_MONTHS', months: 1 }),
    }),
    prevIconProps: normalize({ ...anatomy.attrs('nav-icon'), 'aria-hidden': 'true', 'data-icon': 'chevron-right' satisfies IconName, 'data-direction': 'prev' }),
    nextIconProps: normalize({ ...anatomy.attrs('nav-icon'), 'aria-hidden': 'true', 'data-icon': 'chevron-right' satisfies IconName, 'data-direction': 'next' }),
    gridProps: normalize({
      ...anatomy.attrs('grid'),
      id: ids.grid,
      role: 'grid',
      'aria-labelledby': ids.title,
      'aria-multiselectable': state.mode === 'range' ? 'true' : undefined,
      onKeyDown,
      onPointerLeave: () => send({ type: 'HOVER', date: null }),
    }),
    headRowProps: normalize({ ...anatomy.attrs('head-row'), role: 'row' }),
    getWeekdayProps: (index: number) =>
      normalize({ ...anatomy.attrs('weekday'), role: 'columnheader', abbr: weekdays[index].long, 'aria-label': weekdays[index].long }),
    weekProps: normalize({ ...anatomy.attrs('week'), role: 'row' }),
    getDayProps: (date: ISODate) => {
      const outside = !sameMonth(date, month)
      const unavailable = isUnavailable(state, date)
      const edge = date === rangeStart || date === rangeEnd
      const inRange = rangeStart !== null && rangeEnd !== null && date > rangeStart && date < rangeEnd
      const selected = state.mode === 'single' ? date === state.value.start : edge || inRange
      const focused = date === state.focused
      return normalize({
        ...anatomy.attrs('day'),
        id: ids.day(date),
        role: 'gridcell',
        tabIndex: focused ? 0 : -1,
        'aria-label': formatLongDate(date, locale),
        'aria-selected': selected ? 'true' : 'false',
        'aria-disabled': unavailable ? 'true' : undefined,
        'aria-current': date === state.today ? 'date' : undefined,
        'data-date': date,
        'data-outside': outside ? '' : undefined,
        'data-today': date === state.today ? '' : undefined,
        'data-focused': focused ? '' : undefined,
        'data-selected': selected ? '' : undefined,
        'data-disabled': unavailable ? '' : undefined,
        'data-range-start': state.mode === 'range' && date === rangeStart ? '' : undefined,
        'data-range-end': state.mode === 'range' && date === rangeEnd ? '' : undefined,
        'data-in-range': state.mode === 'range' && inRange ? '' : undefined,
        // Drawn from the pointer, not yet chosen.
        'data-preview': state.anchor !== null && (edge || inRange) ? '' : undefined,
        onClick: () => send({ type: 'SELECT', date }),
        onFocus: () => send({ type: 'FOCUS', date }),
        onPointerEnter: () => {
          if (state.anchor !== null) send({ type: 'HOVER', date })
        },
      })
    },
    /** The day number shown in a cell: the aria-label names it in full. */
    dayText: (date: ISODate) => String(Number(date.slice(8))),
  }
}

export type CalendarApi<T = Dict> = ReturnType<typeof connect<T>>

/** Grids a key was just pressed in: their focus follows the focused day even across a page turn. */
const movedByKeyboard = new WeakSet<Element>()

/**
 * After the keyboard moved the focused day, put the real focus on it — but
 * only if the focus is in the grid already: a calendar that re-renders must
 * not pull the focus from wherever the person is.
 */
export function focusCalendarDay(grid: HTMLElement | null, id: string): void {
  if (!grid) return
  const active = grid.ownerDocument.activeElement
  // A key pressed in the grid may have turned the page: the focused day went
  // with the old month, and the focus fell to the body. Put it on the new one.
  const moved = movedByKeyboard.delete(grid)
  if (!moved && (!active || !grid.contains(active))) return
  const day = grid.ownerDocument.getElementById(id)
  if (day && day !== active) day.focus({ preventScroll: true })
}
