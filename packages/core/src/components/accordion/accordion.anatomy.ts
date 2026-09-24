import { createAnatomy } from '../../types'

/**
 * Accordion (WAI-ARIA APG): a stack of headings, each a button that shows or
 * hides the section under it. One section at a time by default; `multiple`
 * lets several stand open, and `collapsible: false` keeps one always open.
 */

export const accordionAnatomy = createAnatomy('accordion', ['root', 'item', 'heading', 'trigger', 'label', 'description', 'indicator', 'content', 'body'] as const)
export type AccordionPart = (typeof accordionAnatomy.parts)[number]
