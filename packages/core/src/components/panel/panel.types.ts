import type { HeadingLevel, RegionRank } from '../../utils/region'
import type { StatusTone } from '../../utils/tone'

/** `padded` for content; `flush` for a table or a diff that runs to the edge; `list` for rows. */
export type PanelBody = 'padded' | 'flush' | 'list'

export interface PanelProps {
  title?: string
  /** The title's heading level. Default 2. */
  headingLevel?: HeadingLevel
  body?: PanelBody
  /** No border: the surface alone carries the edge. For large regions only. */
  plain?: boolean
  rank?: RegionRank
  tone?: StatusTone
  /** A landmark: role="region", named by the title. */
  region?: boolean
  /** The body scrolls with nothing focusable in it: make it reachable by keyboard. */
  scrollable?: boolean
}
