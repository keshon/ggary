import { createAnatomy } from '../../types'

/** One line of readings along the bottom: items at the start, a spacer, items at the end. */
export const statusBarAnatomy = createAnatomy('status-bar', ['root', 'item', 'spacer'] as const)
export type StatusBarPart = (typeof statusBarAnatomy.parts)[number]
