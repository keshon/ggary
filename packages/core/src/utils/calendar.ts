/**
 * Days as the calendar knows them: `YYYY-MM-DD` strings, with no time and no
 * zone. A date picker's value is a day on a wall calendar, not an instant —
 * "18 September" is the 18th in Moscow and in Vladivostok — so the arithmetic
 * is done in UTC, where no day is 23 or 25 hours long and a clock change can
 * never move one. Pure; nothing here touches the DOM.
 */

export type ISODate = string

const pad = (value: number, length = 2) => String(value).padStart(length, '0')

/** A valid `YYYY-MM-DD`, or null: the 31st of April is not a day. */
export function parseISO(text: string | null | undefined): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text ?? '')
  if (!match) return null
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return { year, month, day }
}

export const isISODate = (text: unknown): boolean => typeof text === 'string' && parseISO(text) !== null

export function toISO(year: number, month: number, day: number): ISODate {
  const date = new Date(Date.UTC(year, month - 1, day))
  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

const toUTC = (iso: ISODate) => {
  const parts = parseISO(iso)!
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day))
}
const fromUTC = (date: Date) => toISO(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())

/** Today where the person is: their wall calendar, not UTC's. */
export function todayISO(now: Date = new Date()): ISODate {
  return toISO(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

export function addDays(iso: ISODate, days: number): ISODate {
  const date = toUTC(iso)
  date.setUTCDate(date.getUTCDate() + days)
  return fromUTC(date)
}

/** Days from `a` to `b`: 1 from the 18th to the 19th, negative backwards. */
export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((toUTC(b).getTime() - toUTC(a).getTime()) / 86_400_000)
}

/** A month on, keeping the day where it can: 31 January plus a month is 28 or 29 February, not 3 March. */
export function addMonths(iso: ISODate, months: number): ISODate {
  const { year, month, day } = parseISO(iso)!
  const index = year * 12 + (month - 1) + months
  const nextYear = Math.floor(index / 12)
  const nextMonth = index - nextYear * 12 + 1
  const last = new Date(Date.UTC(nextYear, nextMonth, 0)).getUTCDate()
  return toISO(nextYear, nextMonth, Math.min(day, last))
}

/** 0 is Sunday, as Date has it. */
export const weekday = (iso: ISODate) => toUTC(iso).getUTCDay()

export function startOfWeek(iso: ISODate, weekStart: number): ISODate {
  return addDays(iso, -((weekday(iso) - weekStart + 7) % 7))
}

export const startOfMonth = (iso: ISODate) => iso.slice(0, 8) + '01'
export const sameMonth = (a: ISODate, b: ISODate) => a.slice(0, 7) === b.slice(0, 7)

/** ISO strings order as days do. */
export const compareDates = (a: ISODate, b: ISODate) => (a < b ? -1 : a > b ? 1 : 0)
export const clampDate = (iso: ISODate, min?: ISODate | null, max?: ISODate | null) =>
  min && iso < min ? min : max && iso > max ? max : iso

/**
 * The weeks a month's page shows: from the week its first day is in to the week
 * its last day is in, each week seven days starting on `weekStart`. Always six
 * weeks, so the grid does not change height as the months go by.
 */
export function monthWeeks(monthOf: ISODate, weekStart: number): ISODate[][] {
  let day = startOfWeek(startOfMonth(monthOf), weekStart)
  const weeks: ISODate[][] = []
  for (let w = 0; w < 6; w += 1) {
    const week: ISODate[] = []
    for (let d = 0; d < 7; d += 1) {
      week.push(day)
      day = addDays(day, 1)
    }
    weeks.push(week)
  }
  return weeks
}

/**
 * The day a locale starts its week on: 1 (Monday) for most of the world,
 * 0 (Sunday) for the United States and a few others, 6 (Saturday) for some.
 * From Intl.Locale's week info where the platform has it; otherwise a short
 * list of the Sunday and Saturday regions, and Monday for the rest.
 */
export function weekStartOf(locale?: string): number {
  try {
    const info = new Intl.Locale(locale ?? Intl.DateTimeFormat().resolvedOptions().locale) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number }
      weekInfo?: { firstDay: number }
    }
    const firstDay = info.getWeekInfo?.().firstDay ?? info.weekInfo?.firstDay
    if (firstDay) return firstDay % 7
    const region = info.maximize().region ?? ''
    if (['US', 'CA', 'MX', 'BR', 'JP', 'KR', 'TW', 'HK', 'IL', 'PH', 'IN', 'ZA', 'AU', 'SA'].includes(region)) return 0
    if (['AE', 'AF', 'BH', 'DJ', 'DZ', 'EG', 'IQ', 'IR', 'JO', 'KW', 'LY', 'OM', 'QA', 'SD', 'SY'].includes(region)) return 6
  } catch {
    // An unknown locale: Monday.
  }
  return 1
}

const cache = new Map<string, Intl.DateTimeFormat>()
const formatter = (locale: string | undefined, options: Intl.DateTimeFormatOptions) => {
  const key = `${locale}|${JSON.stringify(options)}`
  if (!cache.has(key)) cache.set(key, new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }))
  return cache.get(key)!
}

/** "18 Sep 2026", "Sep 18, 2026", "18 сент. 2026 г." — the locale's own. */
export const formatDate = (iso: ISODate, locale?: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  formatter(locale, options).format(toUTC(iso))

/** "Friday, 18 September 2026": a day's name for a screen reader. */
export const formatLongDate = (iso: ISODate, locale?: string) =>
  formatDate(iso, locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

/** "September 2026", "сентябрь 2026 г." */
export const formatMonth = (iso: ISODate, locale?: string) => formatDate(iso, locale, { month: 'long', year: 'numeric' })

/** The weekday heads, from the week's first day: short to show, long to be read. */
export function weekdayNames(locale: string | undefined, weekStart: number): { short: string; long: string }[] {
  // 2023-01-01 was a Sunday.
  return Array.from({ length: 7 }, (_, i) => {
    const iso = toISO(2023, 1, 1 + ((weekStart + i) % 7))
    return { short: formatDate(iso, locale, { weekday: 'short' }), long: formatDate(iso, locale, { weekday: 'long' }) }
  })
}

const fold = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase().replace(/\.$/, '')

/** The locale's month names, long and short, folded for matching. */
function monthNames(locale?: string): string[][] {
  return Array.from({ length: 12 }, (_, m) => {
    const iso = toISO(2023, m + 1, 15)
    return [
      fold(formatDate(iso, locale, { month: 'long' })),
      fold(formatDate(iso, locale, { month: 'short' })),
      // Genitive forms, as a date writes them: "18 сентября".
      fold(formatDate(iso, locale, { day: 'numeric', month: 'long' }).replace(/[\d\s.,]/g, '')),
    ]
  })
}

/** Where day, month and year stand in the locale's numeric dates: d-m-y, m-d-y or y-m-d. */
export function dateOrder(locale?: string): ('day' | 'month' | 'year')[] {
  return formatter(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
    .formatToParts(new Date(Date.UTC(2023, 10, 22)))
    .map((part) => part.type)
    .filter((type): type is 'day' | 'month' | 'year' => type === 'day' || type === 'month' || type === 'year')
}

/**
 * A day typed the way a person types it, read in their locale's order:
 * "2026-09-18", "18.09.2026", "9/18/26", "18 Sep 2026", "сентябрь 18 2026".
 * A two-digit year is this century's. Null when the text is not one day.
 */
export function parseTypedDate(text: string, locale?: string): ISODate | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  if (isISODate(trimmed)) return trimmed
  const tokens = trimmed.match(/\p{L}+\.?|\d+/gu) ?? []
  const numbers: number[] = []
  let month: number | null = null
  const names = monthNames(locale)
  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      numbers.push(Number(token))
      continue
    }
    const word = fold(token)
    if (word.length < 3) continue
    const found = names.findIndex((forms) => forms.some((form) => form.startsWith(word) || word.startsWith(form)))
    if (found === -1) return null
    month = found + 1
  }
  let year: number | undefined
  let day: number | undefined
  if (month !== null) {
    if (numbers.length !== 2) return null
    // With the month in words, the four-digit or the larger number is the year.
    const [a, b] = numbers
    ;[day, year] = a > 31 || (String(a).length === 4) ? [b, a] : [a, b]
  } else {
    if (numbers.length !== 3) return null
    const order = dateOrder(locale)
    const values: Record<string, number> = {}
    // A four-digit first number is a year, whatever the locale says: 2026.09.18.
    const effective = String(numbers[0]).length === 4 ? (['year', 'month', 'day'] as const) : order
    effective.forEach((part, i) => (values[part] = numbers[i]))
    ;({ day, month, year } = values as { day: number; month: number; year: number })
  }
  if (year === undefined || day === undefined || month === null) return null
  if (year < 100) year += 2000
  const iso = `${pad(year, 4)}-${pad(month)}-${pad(day)}`
  return isISODate(iso) ? iso : null
}
