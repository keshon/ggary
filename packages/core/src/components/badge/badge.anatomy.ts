import { createAnatomy } from '../../types'

export const badgeAnatomy = createAnatomy('badge', ['root', 'dot'] as const)
export type BadgePart = (typeof badgeAnatomy.parts)[number]
