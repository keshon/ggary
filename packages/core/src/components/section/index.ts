import type { Dict, Normalizer } from '../../types'
import { createAnatomy } from '../../types'
import { headingTag, type HeadingLevel, type RegionRank } from '../../utils/region'

/**
 * A part of a screen under its own heading, with no box around it: where a
 * Panel is a place with an edge, a section is a stretch of the page — the
 * settings under "Notifications", the cards under "This week".
 *
 * Its heading is a label on what follows, and says how much it matters by
 * rank, as a panel's does. Sections stand farther from each other than the
 * rows inside one stand from each other, or the boundary between them would
 * not read.
 */
export const sectionAnatomy = createAnatomy('section', ['root', 'header', 'title', 'description', 'actions', 'body'] as const)
export type SectionPart = (typeof sectionAnatomy.parts)[number]

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

export const sectionIds = (id: string) => ({ title: `${id}-title`, description: `${id}-description` })

export function connect<T = Dict>(props: SectionProps, normalize: Normalizer<T>) {
  const ids = sectionIds(props.id)
  const titled = props.title !== undefined
  const anatomy = sectionAnatomy
  return {
    ids,
    titleElement: headingTag(props.headingLevel ?? 2),
    rootProps: normalize({
      ...anatomy.attrs('root'),
      id: props.id,
      role: props.region ? 'region' : undefined,
      'aria-labelledby': props.region && titled ? ids.title : undefined,
      'aria-describedby': props.region && props.description ? ids.description : undefined,
      'data-rank': props.rank,
    }),
    headerProps: normalize({ ...anatomy.attrs('header') }),
    titleProps: normalize({ ...anatomy.attrs('title'), id: ids.title }),
    descriptionProps: normalize({ ...anatomy.attrs('description'), id: ids.description }),
    actionsProps: normalize({ ...anatomy.attrs('actions') }),
    bodyProps: normalize({ ...anatomy.attrs('body') }),
  }
}
