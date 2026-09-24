import { addDays, addMonths, startOfMonth, type ISODate } from '../../utils/calendar'
import type { DatePreset, RangePresetWords } from './date-picker.types'

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
