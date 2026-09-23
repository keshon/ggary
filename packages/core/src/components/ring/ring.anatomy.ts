import { createAnatomy } from '../../types'

export const ringAnatomy = createAnatomy('ring', ['root', 'track', 'arc', 'value'] as const)
export type RingPart = (typeof ringAnatomy.parts)[number]
