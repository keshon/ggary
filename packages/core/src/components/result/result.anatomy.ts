import { createAnatomy } from '../../types'

/**
 * How something ended, filling the space the work was in: a payment sent, an
 * import that failed, a page that is not there. A glyph in the tone's ink —
 * or, for an error page, its code drawn large — the words, the next step, and
 * any detail under them. Where EmptyState says there is nothing here yet, a
 * Result says what happened.
 */
export const resultAnatomy = createAnatomy('result', ['root', 'icon', 'code', 'title', 'description', 'actions', 'details'] as const)
export type ResultPart = (typeof resultAnatomy.parts)[number]
