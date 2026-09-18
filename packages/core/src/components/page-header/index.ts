import type { Dict, Normalizer } from '../../types'
import { createAnatomy } from '../../types'
import { headingTag, type HeadingLevel } from '../../utils/region'

/**
 * The top of a screen: where you are (breadcrumbs, above), what this is (the
 * title and a line of description), and what can be done with it (actions, at
 * the far edge). The actions wrap under the title when the screen is narrow
 * rather than squeezing it.
 */
export const pageHeaderAnatomy = createAnatomy('page-header', ['root', 'context', 'main', 'title', 'description', 'actions'] as const)
export type PageHeaderPart = (typeof pageHeaderAnatomy.parts)[number]

export interface PageHeaderProps {
  id: string
  title: string
  description?: string
  /** The title's level. Default 1: a screen has one title, and this is it. */
  headingLevel?: HeadingLevel
}

export const pageHeaderIds = (id: string) => ({ title: `${id}-title`, description: `${id}-description` })

export function connect<T = Dict>(props: PageHeaderProps, normalize: Normalizer<T>) {
  const ids = pageHeaderIds(props.id)
  const anatomy = pageHeaderAnatomy
  return {
    ids,
    titleElement: headingTag(props.headingLevel ?? 1),
    rootProps: normalize({ ...anatomy.attrs('root'), id: props.id }),
    /** Above the title: breadcrumbs, a back link. */
    contextProps: normalize({ ...anatomy.attrs('context') }),
    mainProps: normalize({ ...anatomy.attrs('main') }),
    titleProps: normalize({
      ...anatomy.attrs('title'),
      id: ids.title,
      'aria-describedby': props.description ? ids.description : undefined,
    }),
    descriptionProps: normalize({ ...anatomy.attrs('description'), id: ids.description }),
    actionsProps: normalize({ ...anatomy.attrs('actions') }),
  }
}
