import { createAnatomy } from '../../types'

/** The trigger is the page's own element, described by `content`. */
export const tooltipAnatomy = createAnatomy('tooltip', ['content'] as const)
export type TooltipPart = (typeof tooltipAnatomy.parts)[number]
