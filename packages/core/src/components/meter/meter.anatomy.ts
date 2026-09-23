import { createAnatomy } from '../../types'

export const meterAnatomy = createAnatomy('meter', ['root', 'label', 'track', 'fill', 'value'] as const)
export type MeterPart = (typeof meterAnatomy.parts)[number]
