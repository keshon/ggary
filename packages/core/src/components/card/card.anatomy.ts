import { createAnatomy } from '../../types'

export const cardAnatomy = createAnatomy('card', ['root', 'header', 'title', 'subtitle'] as const)
export type CardPart = (typeof cardAnatomy.parts)[number]
