import type { ControlSize } from '../../utils/size'
import type { ISODate } from '../../utils/calendar'
import type { CalendarWords } from '../calendar/calendar.connect'
import type { CalendarEvent, CalendarOptions, CalendarState, DateRange } from '../calendar/calendar.types'

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

export interface DatePickerWords extends CalendarWords {
  placeholder?: string
  /** The calendar button's name. */
  choose?: string
  /** Said under a field whose text is not a day: receives an example in the locale's order. */
  invalid?: (example: string) => string
}

export interface DatePickerConnectOptions extends DatePickerWords {
  /** The control's size, as Input's and Button's. Default `md`. */
  size?: ControlSize
  /** Choices made in one press beside the calendar. `rangePresets()` gives the usual ones. */
  presets?: DatePreset[]
  /** The presets' name. Default "Presets". */
  presetsLabel?: string
  /** Submits the day as `YYYY-MM-DD`, a range as `YYYY-MM-DD/YYYY-MM-DD` — an ISO 8601 interval. */
  name?: string
  form?: string
}
