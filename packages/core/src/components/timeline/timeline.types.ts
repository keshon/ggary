import type { StatusTone } from '../../utils/tone'

export interface TimelineItem {
  id: string
  /**
   * What happened. When there is a tone, say it here in words too ("Run
   * failed", not "Run"): the dot is not spoken, and it says nothing to anyone
   * who does not tell the tones apart.
   */
  title: string
  /** A line under the title, quieter. */
  detail?: string
  /**
   * When, as an ISO date-time. It becomes the `<time datetime>`, so the moment
   * stays exact where the label shows only the hour.
   */
  time?: string
  /** The time as shown, in place of the one formatted from `time`. */
  timeLabel?: string
  /** The dot's tone. Without one the dot is neutral; `running` pulses. */
  tone?: StatusTone
}

export interface TimelineProps {
  items: TimelineItem[]
  /** A name for the list, where no heading on the page says what it is a chronology of. */
  label?: string
  /** The locale the time labels are formatted in. Default: the runtime's. */
  locale?: string
  /** How a time is formatted. Default: hour and minute. */
  timeFormat?: Intl.DateTimeFormatOptions
}
