import { createAnatomy } from '../../types'

/**
 * A glyph on its own, where an app puts one: an empty element carrying
 * `data-icon`, drawn by the theme as a mask in the colour of the text around
 * it. Decorative unless it is given a label, and then an image of its own.
 */
export const iconAnatomy = createAnatomy('icon', ['root'] as const)
export type IconPart = (typeof iconAnatomy.parts)[number]
