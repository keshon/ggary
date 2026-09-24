import { createAnatomy } from '../../types'

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
