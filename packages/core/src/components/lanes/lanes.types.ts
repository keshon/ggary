import type { StatusTone } from '../../utils/tone'

/** One stretch of work by one worker. The times are milliseconds, on one clock. */
export interface LaneSpan {
  /** Stable identity, for the adapters' keys. Default: its place in the lane. */
  id?: string
  /** What was being done. It is read out in the lane's spoken reading. */
  label: string
  start: number
  end: number
  /** The outcome, from the kit's one vocabulary. Absent: neutral. */
  tone?: StatusTone
}

/** One worker: a row of the chart. */
export interface Lane {
  id: string
  /** The worker. Truncated in the view, whole in its `title`. */
  label: string
  spans: LaneSpan[]
}

export interface LanesProps {
  lanes: Lane[]
  /** Names the whole picture: "The workers of run 4127". Required. */
  label: string
  /** The window's start, in the same milliseconds. Default: the earliest start. */
  start?: number
  /** The window's end. Default: the latest end. */
  end?: number
  /** For the figures in the spoken reading. Default: the page's. */
  locale?: string
}

/** The chart's fixed text. Everything else comes from the work. */
export interface LanesWords {
  /** One stretch, spoken. Default: "reading files, 0.0 s to 3.4 s, succeeded". */
  span?: (label: string, from: string, to: string, outcome: string) => string
  /** Between one stretch's reading and the next. Default "; ". */
  separator?: string
  /** Between the worker's name and its reading. Default ": ". */
  labelSeparator?: string
  /** A moment on the axis. Default: "3.4 s". */
  time?: (value: string) => string
  /** A worker with nothing on the axis. */
  idle?: string
  /** The outcomes in words, since a colour is spoken by nothing. */
  neutral?: string
  running?: string
  ok?: string
  warn?: string
  error?: string
}

export type LaneToneWords = Record<StatusTone, string>
