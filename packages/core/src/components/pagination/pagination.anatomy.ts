import { createAnatomy } from '../../types'

/** A nav around an ordered list of pages; the ellipsis is a gap, not a page. */
export const paginationAnatomy = createAnatomy('pagination', ['root', 'list', 'item', 'link', 'gap'] as const)
export type PaginationPart = (typeof paginationAnatomy.parts)[number]
