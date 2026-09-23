import { createAnatomy } from '../../types'

export const sparklineAnatomy = createAnatomy('sparkline', ['root', 'area', 'line', 'last'] as const)
export type SparklinePart = (typeof sparklineAnatomy.parts)[number]
