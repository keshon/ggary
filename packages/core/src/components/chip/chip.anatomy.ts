import { createAnatomy } from '../../types'

export const chipAnatomy = createAnatomy('chip', ['root', 'label', 'remove'] as const)
export type ChipPart = (typeof chipAnatomy.parts)[number]
