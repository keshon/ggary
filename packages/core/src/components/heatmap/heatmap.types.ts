import type { ISODate } from '../../utils/calendar'

export interface HeatmapDay {
  /** The day, `YYYY-MM-DD`. A day on a wall calendar, with no time and no zone. */
  date: ISODate
  /** How much happened on it. Several entries for one day are added together. */
  value: number
}

/** The intensity of a day: 0 is the empty ground, 4 the busiest quarter. */
export type HeatmapLevel = 0 | 1 | 2 | 3 | 4

export interface HeatmapProps {
  /** The days, in any order. The field runs from the earliest to the latest. */
  days: HeatmapDay[]
  /** The day a week starts on, 0 Sunday to 6 Saturday. Default: the locale's own. */
  weekStart?: number
  /** What the field counts: "Runs a day". It stands before the summary in the name. */
  label?: string
  /** The unit the values are in: "runs", "commits". Said after each number in words. */
  unit?: string
  /** For the numbers and the dates in words. Default: the page's. */
  locale?: string
}

/** The fixed text of the field's name and of a cell's title. */
export interface HeatmapWords {
  /** A day with something on it: "3 runs on 14 September". */
  day?: (value: string, date: string, unit?: string) => string
  /** A day with nothing on it: "No runs on 14 September". */
  none?: (date: string, unit?: string) => string
  /** The whole field in words: how much, over how long, and the busiest day. */
  summary?: (total: string, weeks: number, busiest: { value: string; date: string } | null, unit?: string) => string
  /** The name of a field with no days in it. */
  empty?: string
  /** Between the field's own label and the summary. Default ": ". */
  labelSeparator?: string
}
