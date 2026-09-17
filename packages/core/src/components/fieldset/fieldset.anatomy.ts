import { createAnatomy } from '../../types'

/** A native <fieldset> root and <legend>; content, then the hint-or-error slot, as in Field. */
export const fieldsetAnatomy = createAnatomy('fieldset', ['root', 'legend', 'content', 'hint', 'error'] as const)
export type FieldsetPart = (typeof fieldsetAnatomy.parts)[number]
