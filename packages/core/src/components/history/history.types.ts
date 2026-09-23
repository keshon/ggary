import type { StatusTone } from '../../utils/tone'

/**
 * The height of the strip. `sm`: a column in a table of objects, where a strip
 * at glyph height out-shouts the names it belongs to. `md`: in a row beside a
 * name and a badge, a mark among marks. `lg`: on the screen OF one object,
 * where the strip is the subject rather than an annotation.
 */
export type HistorySize = 'sm' | 'md' | 'lg'

export interface HistoryTick {
  /** How that attempt ended. With none: it happened and the result is unknown. */
  tone?: StatusTone
  /** **Nobody looked.** The room stays, the mark does not — which is not the same as an unknown result. */
  empty?: boolean
  /** What this attempt was, for the pointer. Not spoken: the strip carries the reading. */
  title?: string
}

/** A batch of attempts with a shared name: an hour, a day, a run. */
export interface HistoryGroup {
  ticks: HistoryTick[]
  /** The name of the batch. Any group with one puts a ruler under the strip. */
  label?: string
  /**
   * How many attempts the batch stands for, when it draws fewer marks than it
   * holds: an hour of forty checks shown as one brick keeps its share of the
   * strip. Default: how many ticks it has.
   */
  count?: number
  /** This label may be dropped when the ruler is narrow. The cell keeps its place. */
  minor?: boolean
  /** The batch in words, for the pointer: "03:00 — 5 checks". */
  title?: string
}

export interface HistoryProps {
  /** The attempts, oldest first. The strip is read as time, and time runs to the end. */
  ticks?: HistoryTick[]
  /** The attempts in batches, oldest first. Given these, `ticks` is not read. */
  groups?: HistoryGroup[]
  /** What the strip is a history of: "Nightly build". It stands before the reading in the name. */
  label?: string
  size?: HistorySize
  /** For the figures in the reading. Default: the page's. */
  locale?: string
}

/** How the attempts of a strip ended. */
export interface HistoryCounts {
  ok: number
  warn: number
  error: number
  running: number
  /** The attempt happened and the result is unknown. */
  unknown: number
  /** There was no attempt. */
  empty: number
}

/** The fixed text of the strip's name. */
export interface HistoryWords {
  /**
   * The whole strip in words: how many attempts, and how they ended. The
   * counts arrive as numbers, for the plurals, with `write` to put any of
   * them into the locale's own figures.
   */
  summary(total: string, counts: HistoryCounts, write: (count: number) => string): string
  /** The name of a strip with nothing in it yet. */
  empty: string
  /** Between the strip's own label and the reading. */
  labelSeparator: string
}
