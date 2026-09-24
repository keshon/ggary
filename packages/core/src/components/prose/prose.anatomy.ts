import { createAnatomy } from '../../types'

/**
 * Text written to be read: an article, a help page, an agent's answer, the
 * HTML a markdown renderer gives. Its elements are styled as they come — p,
 * h1–h6, lists, quotes, code, tables, rules — at a reading size, with a line
 * bounded at a reading measure. The kit's heading ladder lives here and only
 * here: outside prose a title takes its size from the component it names.
 */
export const proseAnatomy = createAnatomy('prose', ['root'] as const)
export type ProsePart = (typeof proseAnatomy.parts)[number]
