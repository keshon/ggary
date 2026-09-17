import type { HeadingLevel, RegionRank } from '../../utils/region'
import type { StatusTone } from '../../utils/tone'

export interface CardProps {
  title?: string
  /** A caption under the title. */
  subtitle?: string
  /** The title's heading level. Default 3: cards usually stand in a list under a section. */
  headingLevel?: HeadingLevel
  /** The whole card is the link: the target equals the card, and there is no second link inside. */
  href?: string
  /** Hover and focus styling for a card the application makes pressable. A link card has it already. */
  interactive?: boolean
  /** No border: the surface alone carries the edge. For large cards only. */
  plain?: boolean
  rank?: RegionRank
  tone?: StatusTone
}
