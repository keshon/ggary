import { createAnatomy } from '../../types'

/**
 * One disclosure, built the way the Accordion's section is — a button that
 * owns its region — rather than as an Accordion item. The reasons are in
 * thinking.connect.ts.
 */
export const thinkingAnatomy = createAnatomy('thinking', ['root', 'trigger', 'indicator', 'label', 'content', 'body'] as const)
export type ThinkingPart = (typeof thinkingAnatomy.parts)[number]
