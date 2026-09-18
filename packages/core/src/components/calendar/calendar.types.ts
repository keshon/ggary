import type { ISODate } from '../../utils/calendar'

export type CalendarMode = 'single' | 'range'

export interface DateRange {
  start: ISODate | null
  end: ISODate | null
}

export interface CalendarOptions {
  mode: CalendarMode
  /** The first day that can be chosen, and the last. */
  min: ISODate | null
  max: ISODate | null
  /** 0 Sunday … 6 Saturday. Defaults to the locale's. */
  weekStart: number
  /** Days that cannot be chosen, besides the ones outside min and max: weekends, holidays. */
  isDateDisabled: ((date: ISODate) => boolean) | null
}

export interface CalendarState extends CalendarOptions {
  id: string
  /** The day the keyboard is on; the month shown is its month. */
  focused: ISODate
  today: ISODate
  /** The chosen day, or the chosen range. A single calendar uses `start` alone. */
  value: DateRange
  /** A range half chosen: its first end, waiting for the second. */
  anchor: ISODate | null
  /** The day under the pointer, for the range a second press would make. */
  hovered: ISODate | null
  controlled: boolean
  intent: { value: DateRange; nonce: number }
}

export type CalendarEvent =
  | { type: 'FOCUS'; date: ISODate }
  | { type: 'MOVE'; days: number }
  | { type: 'MOVE_MONTHS'; months: number }
  | { type: 'WEEK_EDGE'; edge: 'start' | 'end' }
  | { type: 'SELECT'; date?: ISODate }
  | { type: 'HOVER'; date: ISODate | null }
  | { type: 'CLEAR' }
  /** A value chosen elsewhere — typed in a field — committed as a press would be. */
  | { type: 'SET'; value: DateRange }
  | { type: 'SYNC_VALUE'; value: DateRange }
  | { type: 'SYNC_TODAY'; today: ISODate }
  | ({ type: 'SYNC_OPTIONS' } & Partial<CalendarOptions>)
