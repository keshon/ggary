/**
 * Times of day on a wall clock: `HH:mm`, 00:00 to 23:59, with no date and no
 * time zone — the same 09:30 in Moscow and in Vladivostok, as a day in
 * utils/calendar is the same day. Which zone a time is in is the app's to say.
 */
export type ISOTime = string

const ISO_TIME = /^([01]\d|2[0-3]):([0-5]\d)$/

export const isISOTime = (value: unknown): value is ISOTime => typeof value === 'string' && ISO_TIME.test(value)

/** Minutes since midnight. */
export const minutesOf = (time: ISOTime) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))

export const timeOf = (minutes: number): ISOTime => {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/** A time in the locale's words: "9:30 AM", "09:30", "9:30 vorm.". */
export function formatTime(time: ISOTime, locale?: string): string {
  const [hours, minutes] = [Number(time.slice(0, 2)), Number(time.slice(3, 5))]
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(Date.UTC(2026, 0, 1, hours, minutes))
}

/** Whether the locale reads a clock in twelve hours with a day period, or in twenty-four. */
export function hourCycle(locale?: string): 12 | 24 {
  const cycle = new Intl.DateTimeFormat(locale, { hour: 'numeric', timeZone: 'UTC' }).resolvedOptions().hourCycle
  return cycle === 'h11' || cycle === 'h12' ? 12 : 24
}

/** The locale's words for before and after noon, lower-cased and without dots: ["am", "pm"], ["vorm", "nachm"]. */
function dayPeriods(locale?: string): [string, string] {
  const format = new Intl.DateTimeFormat(locale, { hour: 'numeric', hour12: true, timeZone: 'UTC' })
  const period = (hour: number) =>
    (format.formatToParts(Date.UTC(2026, 0, 1, hour)).find((part) => part.type === 'dayPeriod')?.value ?? '').toLowerCase().replace(/[.\s]/g, '')
  return [period(9), period(21)]
}

/**
 * A time typed as people type one: "9", "930", "0930", "9:30", "9.30", "9h30",
 * "21:30", "9:30pm", "9 PM", "9p", "12am", or with the locale's own words for
 * the day's halves. Null for anything that is not a time of day.
 */
export function parseTypedTime(text: string, locale?: string): ISOTime | null {
  let rest = text.trim().toLowerCase().replace(/\./g, (dot, at, all) => (/\d/.test(all[at + 1] ?? '') ? ':' : ''))
  if (rest === '') return null
  const [am, pm] = dayPeriods(locale)
  let half: 'am' | 'pm' | null = null
  const periods: [string, 'am' | 'pm'][] = [[pm, 'pm'], [am, 'am'], ['pm', 'pm'], ['am', 'am'], ['p', 'pm'], ['a', 'am']]
  rest = rest.replace(/\s+/g, '')
  // After the time in most languages, before it in some (Korean, Chinese, Japanese): either end.
  for (const [word, which] of periods) {
    if (!word) continue
    if (rest.endsWith(word)) {
      half = which
      rest = rest.slice(0, -word.length)
      break
    }
    if (rest.startsWith(word) && word.length > 1) {
      half = which
      rest = rest.slice(word.length)
      break
    }
  }
  let hours: number
  let minutes: number
  const split = /^(\d{1,2})[:h](\d{1,2})$/.exec(rest)
  if (split) {
    hours = Number(split[1])
    minutes = Number(split[2])
  } else if (/^\d{1,4}$/.test(rest)) {
    if (rest.length <= 2) {
      hours = Number(rest)
      minutes = 0
    } else {
      hours = Number(rest.slice(0, rest.length - 2))
      minutes = Number(rest.slice(-2))
    }
  } else return null
  if (minutes > 59) return null
  if (half) {
    if (hours < 1 || hours > 12) return null
    hours = (hours % 12) + (half === 'pm' ? 12 : 0)
  } else if (hours > 23) return null
  return timeOf(hours * 60 + minutes)
}

/** The times from `min` to `max` at every `step` minutes, starting from `min` (or midnight). */
export function timeSteps(step = 15, min?: ISOTime | null, max?: ISOTime | null): ISOTime[] {
  const every = Math.max(1, Math.min(720, Math.round(step)))
  const from = min ? minutesOf(min) : 0
  const to = max ? minutesOf(max) : 1439
  const out: ISOTime[] = []
  for (let m = from; m <= to; m += every) out.push(timeOf(m))
  return out
}

/** The time in `times` nearest to `time`; the earlier on a tie. */
export function nearestTime(times: ISOTime[], time: ISOTime): ISOTime | null {
  let best: ISOTime | null = null
  let distance = Infinity
  const target = minutesOf(time)
  for (const candidate of times) {
    const d = Math.abs(minutesOf(candidate) - target)
    if (d < distance) {
      best = candidate
      distance = d
    }
  }
  return best
}

/** The time on the wall clock now, to the minute. */
export function nowTime(date = new Date()): ISOTime {
  return timeOf(date.getHours() * 60 + date.getMinutes())
}

/** A day and a time of day on a wall clock, `YYYY-MM-DDTHH:mm`, with no zone: whose clock it is, the app says. */
export type ISODateTime = string

const ISO_DATE_TIME = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/

/** A day and a time as one value, once both are there. */
export function joinDateTime(date: string | null | undefined, time: ISOTime | null | undefined): ISODateTime | null {
  return date && time ? `${date}T${time}` : null
}

/** The day and the time of a date-time; a bare day keeps its day and no time. */
export function splitDateTime(value: string | null | undefined): { date: string | null; time: ISOTime | null } {
  if (!value) return { date: null, time: null }
  const match = ISO_DATE_TIME.exec(value)
  if (match) return { date: match[1], time: isISOTime(match[2]) ? match[2] : null }
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? { date: value, time: null } : { date: null, time: null }
}
