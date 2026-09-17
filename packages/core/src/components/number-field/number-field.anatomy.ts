import { createAnatomy } from '../../types'

/** A wrapper that is the visible control, the axis letter that drags, and the native number input. */
export const numberFieldAnatomy = createAnatomy('number-field', ['root', 'axis', 'input'] as const)
export type NumberFieldPart = (typeof numberFieldAnatomy.parts)[number]
