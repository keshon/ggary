import { addDays, addMonths, daysBetween, formatDate, startOfMonth, startOfWeek, todayISO, weekday, weekStartOf, type ISODate } from '../../utils/calendar'
import type { GanttRange, GanttScale, GanttTask, ScaleCell } from './gantt.types'

/** How much room a scale leaves around the tasks, and where it lines its edges up. */
const PADDING: Record<GanttScale, number> = { day: 3, week: 7, month: 14 }

/**
 * The days the chart shows: the tasks' first to last day with some room on
 * either side, lined up on the scale's own unit — a week's first day, a
 * month's — so the header's cells are whole.
 */
export function rangeOf(tasks: GanttTask[], scale: GanttScale, locale?: string, today: ISODate = todayISO()): GanttRange {
  const days = tasks.flatMap((task) => [task.start, task.end])
  const first = days.length ? days.reduce((a, b) => (a < b ? a : b)) : today
  const last = days.length ? days.reduce((a, b) => (a > b ? a : b)) : addDays(today, 27)
  let start = addDays(first, -PADDING[scale])
  let end = addDays(last, PADDING[scale])
  if (scale === 'week') {
    const weekStart = weekStartOf(locale)
    start = startOfWeek(start, weekStart)
    end = addDays(startOfWeek(end, weekStart), 6)
  } else if (scale === 'month') {
    start = startOfMonth(start)
    end = addDays(startOfMonth(addMonths(startOfMonth(end), 1)), -1)
  }
  return { start, end }
}

/** Cells for one unit across a range: each day, each week, each month, each year — cut to the range. */
function cells(range: GanttRange, unit: 'day' | 'week' | 'month' | 'year', label: (day: ISODate) => [string, string], weekStart: number): ScaleCell[] {
  const out: ScaleCell[] = []
  const total = daysBetween(range.start, range.end) + 1
  const today = todayISO()
  let day = range.start
  while (daysBetween(range.start, day) < total) {
    const next =
      unit === 'day'
        ? addDays(day, 1)
        : unit === 'week'
          ? addDays(startOfWeek(day, weekStart), 7)
          : unit === 'month'
            ? startOfMonth(addMonths(startOfMonth(day), 1))
            : `${Number(day.slice(0, 4)) + 1}-01-01`
    const start = daysBetween(range.start, day)
    const span = Math.min(daysBetween(day, next), total - start)
    const [text, title] = label(day)
    const dow = weekday(day)
    out.push({ label: text, title, start, span, weekend: unit === 'day' && (dow === 0 || dow === 6) ? true : undefined, today: unit === 'day' && day === today ? true : undefined })
    day = next
  }
  return out
}

/** The scale's two header rows: months over days, months over weeks, years over months. */
export function scaleRows(range: GanttRange, scale: GanttScale, locale?: string): [ScaleCell[], ScaleCell[]] {
  const weekStart = weekStartOf(locale)
  const month = (day: ISODate): [string, string] => [formatDate(day, locale, { month: 'long', year: 'numeric' }), formatDate(day, locale, { month: 'long', year: 'numeric' })]
  if (scale === 'day') {
    return [
      cells(range, 'month', month, weekStart),
      cells(range, 'day', (day) => [String(Number(day.slice(8))), formatDate(day, locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })], weekStart),
    ]
  }
  if (scale === 'week') {
    return [
      cells(range, 'month', month, weekStart),
      cells(range, 'week', (day) => [formatDate(startOfWeek(day, weekStart), locale, { day: 'numeric', month: 'short' }), formatDate(startOfWeek(day, weekStart), locale, { day: 'numeric', month: 'long', year: 'numeric' })], weekStart),
    ]
  }
  return [
    cells(range, 'year', (day) => [day.slice(0, 4), day.slice(0, 4)], weekStart),
    cells(range, 'month', (day) => [formatDate(day, locale, { month: 'short' }), formatDate(day, locale, { month: 'long', year: 'numeric' })], weekStart),
  ]
}
