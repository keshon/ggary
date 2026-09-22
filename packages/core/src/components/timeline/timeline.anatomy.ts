import { createAnatomy } from '../../types'

export const timelineAnatomy = createAnatomy('timeline', ['root', 'item', 'dot', 'body', 'detail', 'time'] as const)
export type TimelinePart = (typeof timelineAnatomy.parts)[number]
