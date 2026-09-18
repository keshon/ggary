import { createAnatomy } from '../../types'

/** The narrow column of sections: a glyph over a short name, the ones at the bottom pushed there by the spacer. */
export const railAnatomy = createAnatomy('rail', ['root', 'item', 'icon', 'label', 'count', 'spacer'] as const)
export type RailPart = (typeof railAnatomy.parts)[number]
