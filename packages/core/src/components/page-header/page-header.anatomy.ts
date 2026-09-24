import { createAnatomy } from '../../types'

/**
 * The top of a screen: where you are (breadcrumbs, above), what this is (the
 * title and a line of description), and what can be done with it (actions, at
 * the far edge). The actions wrap under the title when the screen is narrow
 * rather than squeezing it.
 */
export const pageHeaderAnatomy = createAnatomy('page-header', ['root', 'context', 'main', 'title', 'description', 'actions'] as const)
export type PageHeaderPart = (typeof pageHeaderAnatomy.parts)[number]
