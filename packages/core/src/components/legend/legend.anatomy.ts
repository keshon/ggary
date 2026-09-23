import { createAnatomy } from '../../types'

export const legendAnatomy = createAnatomy('legend', ['root', 'item', 'swatch', 'label', 'value'] as const)
export type LegendPart = (typeof legendAnatomy.parts)[number]
