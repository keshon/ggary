import { createAnatomy } from '../../types'

export const lanesAnatomy = createAnatomy('lanes', ['root', 'lane', 'label', 'track', 'span', 'lane-text'] as const)
export type LanesPart = (typeof lanesAnatomy.parts)[number]
