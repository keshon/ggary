import { createAnatomy } from '../../types'

/** One part: the native <input> itself. Affixes (prefix/suffix) are a later addition. */
export const inputAnatomy = createAnatomy('input', ['root'] as const)
export type InputPart = (typeof inputAnatomy.parts)[number]
