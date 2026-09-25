import { createAnatomy } from '../../types'

/**
 * The native <input> itself. A password field adds a wrapper (`field`) with
 * the show-and-hide button (`reveal`) laid over the input's end: the input
 * keeps its own box, border and focus ring.
 */
export const inputAnatomy = createAnatomy('input', ['root', 'field', 'reveal', 'reveal-icon'] as const)
export type InputPart = (typeof inputAnatomy.parts)[number]
