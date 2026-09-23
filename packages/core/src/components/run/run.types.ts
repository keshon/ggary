import type { StatusTone } from '../../utils/tone'

/**
 * One countable unit of a run: a phase, an attempt, a shard, one agent of a
 * fan-out. The units of a run are parallel and nameless — the order between
 * them means nothing — so a unit carries an outcome and nothing else.
 */
export interface RunUnit {
  /** How it ended. With none, it has not begun; `running` is the one going. */
  tone?: StatusTone
  /** What this unit is, for the pointer. Not spoken: the strip carries the reading. */
  title?: string
}

export interface RunProps {
  /** The units, in the order the work lists them. Few: fifty dots are not counted by eye. */
  units: RunUnit[]
  /** What is being counted: "Agents finished". Without it the reading is the name. */
  label?: string
  /** Show the reading in words beside the dots. Default: shown — seven dots are not counted by eye. */
  showValue?: boolean
  /** For the figures in the reading. Default: the page's. */
  locale?: string
}

/** The fixed text of the reading. */
export interface RunWords {
  /** How many of how many are finished: "4 of 7 done". */
  reading(done: string, total: string): string
  /** The units that failed. Said whenever there are any: colour is not the only carrier. */
  failed(count: number): string
  /** The units that finished with a remark. */
  warned(count: number): string
  /** Between the parts of the reading. */
  separator: string
  /** Between the label and the reading. */
  labelSeparator: string
}
