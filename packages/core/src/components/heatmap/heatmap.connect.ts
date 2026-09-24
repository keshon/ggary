import type { Dict, Normalizer } from '../../types'
import { addDays, formatDate, isISODate, startOfWeek, weekStartOf, type ISODate } from '../../utils/calendar'
import { heatmapAnatomy as anatomy } from './heatmap.anatomy'
import type { HeatmapDay, HeatmapLevel, HeatmapProps, HeatmapWords } from './heatmap.types'

const DAY_FORMAT: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }

export const HEATMAP_WORDS: Required<HeatmapWords> = {
  day: (value, date, unit) => (unit ? `${value} ${unit} on ${date}` : `${value} on ${date}`),
  none: (date, unit) => (unit ? `No ${unit} on ${date}` : `Nothing on ${date}`),
  summary: (total, weeks, busiest, unit) =>
    `${total}${unit ? ` ${unit}` : ''} over ${weeks === 1 ? '1 week' : `${weeks} weeks`}` +
    (busiest ? `, the busiest ${busiest.value} on ${busiest.date}` : ''),
  empty: 'Nothing yet',
  labelSeparator: ': ',
}

/**
 * Where the four steps are cut, from the days that have something on them:
 * the 25th, 50th and 75th value by rank. The ramp is a ranking rather than a
 * fraction of the largest day, because one release day of 400 would flatten
 * a year of 3s and 5s into one pale step — and the field is read by area, so
 * what has to differ is the number of cells at each step, not their distance
 * from a maximum nothing else comes near.
 *
 * Equal values always take the same step: the cut is a value, not a position.
 * A field of identical days is therefore one step throughout, which is the
 * honest drawing of a field with no intensity in it.
 */
export function heatmapThresholds(values: number[]): [number, number, number] {
  const active = values.filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b)
  if (active.length === 0) return [0, 0, 0]
  const at = (p: number) => active[Math.min(active.length - 1, Math.max(0, Math.ceil(p * active.length) - 1))]
  return [at(0.25), at(0.5), at(0.75)]
}

/** 0 for a day nothing was counted on, 1 to 4 by the cuts above. */
export function heatmapLevel(value: number, thresholds: [number, number, number]): HeatmapLevel {
  if (!Number.isFinite(value) || value <= 0) return 0
  if (value <= thresholds[0]) return 1
  if (value <= thresholds[1]) return 2
  if (value <= thresholds[2]) return 3
  return 4
}

/**
 * How much of something happened per day, across weeks: a contribution field.
 * Its axis is INTENSITY, not a category and not an outcome, so it takes
 * neither the series palette — those colours are chosen to be told apart, and
 * a ramp needs the opposite — nor the tone vocabulary. Core gives each cell
 * its step, `data-level` 0 to 4, and the theme holds the five colours.
 *
 * The layout is a column per week and a row per day of the week, with the
 * leading and trailing blanks (`data-empty`) that keep the rows lined up: the
 * range begins and ends mid-week, and the room for those days stays while the
 * mark does not. Months are named along the top, but only where a month owns
 * at least two columns — a label over a single week would sit on its
 * neighbour.
 *
 * The whole field is ONE picture: `role="img"` with a summary in words, and
 * the cells are hidden from assistive tech. A screen reader cannot usefully
 * walk three hundred and sixty-five cells, and each of them is a coloured box
 * with nothing inside; the title on a cell is for the pointer, and everything
 * a reader is owed has to be in the name. No machine.
 */
export function connect<T = Dict>(props: HeatmapProps, normalize: Normalizer<T>, options: { words?: HeatmapWords } = {}) {
  const { words = {} } = options
  const { days, label, unit, locale } = props
  const w = { ...HEATMAP_WORDS, ...words }
  const weekStart = props.weekStart ?? weekStartOf(locale)
  const number = new Intl.NumberFormat(locale)
  const dayName = (date: ISODate) => formatDate(date, locale, DAY_FORMAT)

  // A day may arrive more than once — one record per run — and the field
  // counts the day, so the records for one day are added together.
  const byDate = new Map<ISODate, number>()
  for (const day of days as HeatmapDay[]) {
    if (!isISODate(day.date)) continue
    const value = Number.isFinite(day.value) ? day.value : 0
    byDate.set(day.date, (byDate.get(day.date) ?? 0) + value)
  }
  const dates = [...byDate.keys()].sort()

  const thresholds = heatmapThresholds([...byDate.values()])
  let total = 0
  let busiest: { value: number; date: ISODate } | null = null
  for (const date of dates) {
    const value = byDate.get(date)!
    total += value
    if (value > 0 && (busiest === null || value > busiest.value)) busiest = { value, date }
  }

  const weeks: {
    key: ISODate
    monthLabel?: string
    weekProps: T
    monthLabelProps: T
    days: { key: ISODate; date: ISODate; value: number; level: HeatmapLevel; empty: boolean; title: string; dayProps: T }[]
  }[] = []

  if (dates.length > 0) {
    const first = dates[0]
    const last = dates[dates.length - 1]
    const gridEnd = addDays(startOfWeek(last, weekStart), 6)
    for (let start = startOfWeek(first, weekStart); start <= gridEnd; start = addDays(start, 7)) {
      const week = {
        key: start,
        weekProps: normalize({ ...anatomy.attrs('week') }),
        monthLabelProps: normalize({ ...anatomy.attrs('month-label'), 'aria-hidden': 'true' }),
        days: [] as (typeof weeks)[number]['days'],
      }
      for (let i = 0; i < 7; i += 1) {
        const date = addDays(start, i)
        const empty = date < first || date > last
        const value = byDate.get(date) ?? 0
        const level = empty ? 0 : heatmapLevel(value, thresholds)
        const title = empty ? '' : value > 0 ? w.day(number.format(value), dayName(date), unit) : w.none(dayName(date), unit)
        week.days.push({
          key: date,
          date,
          value,
          level,
          empty,
          title,
          dayProps: normalize({
            ...anatomy.attrs('day'),
            'data-level': empty ? undefined : String(level),
            'data-empty': empty ? '' : undefined,
            title: empty ? undefined : title,
            'aria-hidden': 'true',
          }),
        })
      }
      weeks.push(week)
    }

    // A week belongs to the month of its middle day, so a label stands over
    // the columns the month actually fills. A run of one week goes unnamed.
    const monthOf = (index: number) => weeks[index].days[3].date.slice(0, 7)
    for (let index = 0; index < weeks.length; ) {
      let end = index + 1
      while (end < weeks.length && monthOf(end) === monthOf(index)) end += 1
      if (end - index >= 2) weeks[index].monthLabel = formatDate(weeks[index].days[3].date, locale, { month: 'short' })
      index = end
    }
  }

  const name =
    dates.length === 0
      ? w.empty
      : (() => {
          const summary = w.summary(
            number.format(total),
            weeks.length,
            busiest ? { value: number.format(busiest.value), date: dayName(busiest.date) } : null,
            unit
          )
          return label ? `${label}${w.labelSeparator}${summary}` : summary
        })()

  return {
    weeks,
    total,
    /** The summary, as the root is named by it. */
    label: name,
    rootProps: normalize({ ...anatomy.attrs('root'), role: 'img', 'aria-label': name }),
  }
}
