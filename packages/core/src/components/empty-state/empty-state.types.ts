import type { HeadingLevel, LiveMode } from '../../utils/region'

export interface EmptyStateProps {
  /** Why it is empty: "No runs yet", "Nothing matches “worldgen”". */
  title: string
  description?: string
  /** A real heading when the empty state fills a region. Without it the title is text. */
  headingLevel?: HeadingLevel
  /** `polite` when it appears in response to something, such as a filter that found nothing. */
  live?: LiveMode
}
