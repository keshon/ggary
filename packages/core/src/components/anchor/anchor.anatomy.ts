import { createAnatomy } from '../../types'

/**
 * On-page navigation: a `list` of links to the page's sections, one level of
 * sections within sections, in a `panel`. Where the page has no room for it,
 * the panel folds behind a `trigger` at the window's corner, which names the
 * section being read.
 */
export const anchorAnatomy = createAnatomy('anchor', ['root', 'trigger', 'trigger-icon', 'trigger-label', 'panel', 'list', 'item', 'link'] as const)
export type AnchorPart = (typeof anchorAnatomy.parts)[number]
