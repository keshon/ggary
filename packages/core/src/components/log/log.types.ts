/**
 * How loud a line is. An axis of the component's own, wider than the kit's
 * tones because a machine has a `debug` and the kit has no colour for one —
 * and narrower in colour, since only `warn` and `error` take a tone at all.
 * In a stream of a thousand lines what is coloured is what asks to be seen.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogLine {
  /** Stable identity, for the adapters' keys. Default: the line's place in the list. */
  id?: string
  level: LogLevel
  /** The moment. A number or a Date is formatted to the second; a string is printed as given. */
  time?: string | number | Date
  text: string
}

export interface LogProps {
  /** The lines, oldest first: the newest arrives at the end, where a terminal puts it. */
  lines: LogLine[]
  /**
   * Names the region. Required: two logs on one screen with no names are
   * indistinguishable by ear.
   */
  label: string
  /** For the times. Default: the page's. */
  locale?: string
  /** The time zone for the times. Default: the reader's. */
  timeZone?: string
  /**
   * Speak the lines as they arrive. Default FALSE, which is the honest
   * default for a machine: `role="log"` implies a polite live region, and a
   * stream of hundreds of lines a second read aloud makes the page unusable.
   * What is happening is said by the run's own status instead. Turn it on for
   * a log that speaks rarely — a deploy, an audit trail.
   */
  announce?: boolean
}

/** The level in words, where the machine's own word is not the reader's. */
export type LogWords = Partial<Record<LogLevel, string>>
