import type { HeadingLevel, LiveMode } from '../../utils/region'
import type { StatusTone } from '../../utils/tone'

/** The outcomes a Result names; `running` is not one — a result has ended. */
export type ResultTone = Exclude<StatusTone, 'running'>

export interface ResultProps {
  /** Default `neutral`. */
  tone?: ResultTone
  /** What happened, in words: "Payment sent", "Page not found". */
  title: string
  description?: string
  /**
   * An error page's code — "404", "403", "500" — drawn large in place of the
   * glyph. It is decoration: the title says what it means.
   */
  code?: string
  /** A real heading when the result fills a page or a region. Default 2. */
  headingLevel?: HeadingLevel
  /** `polite` when it replaces the work in response to something; `alert` for a failure. */
  live?: LiveMode
}
