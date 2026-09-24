import type { HeadingLevel, RegionRank } from '../../utils/region'

export interface SectionProps {
  id: string
  title?: string
  description?: string
  /** Default 2. */
  headingLevel?: HeadingLevel
  rank?: RegionRank
  /** A landmark: role="region", named by the title. For the few sections a screen reader should list. */
  region?: boolean
}
