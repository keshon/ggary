import { createAnatomy } from '../../types'

/**
 * A run of text inside a line, said a particular way: quieter, in a state's
 * ink, stronger, as code or a key, marked or struck, or cut to its room. It
 * is one element, the most meaningful of what was asked: `<Text strong code>`
 * is a <code> that is also strong.
 */
export const textAnatomy = createAnatomy('text', ['root'] as const)
export type TextPart = (typeof textAnatomy.parts)[number]
