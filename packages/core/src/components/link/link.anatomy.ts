import { createAnatomy } from '../../types'

/**
 * A link in the kit's ink. Underlined always: in running text a link told
 * from its words by colour alone is lost to whoever cannot see the colour. An
 * external one opens a new tab, shows it with a glyph and says it in words.
 */
export const linkAnatomy = createAnatomy('link', ['root', 'icon', 'hint'] as const)
export type LinkPart = (typeof linkAnatomy.parts)[number]
