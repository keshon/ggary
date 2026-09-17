import { createAnatomy } from '../../types'

/**
 * Two parts, and the field is not one of them: the input inside a search IS an
 * Input, with the input scope, so the theme's field rules reach it unchanged
 * and this file only makes room for the glyph.
 */
export const searchAnatomy = createAnatomy('search', ['root', 'icon'] as const)
export type SearchPart = (typeof searchAnatomy.parts)[number]
