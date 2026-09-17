import { createAnatomy } from '../../types'

/** The side column: groups of links, each group named. */
export const navAnatomy = createAnatomy('nav', ['root', 'group', 'group-label', 'item', 'icon', 'count'] as const)
export type NavPart = (typeof navAnatomy.parts)[number]
