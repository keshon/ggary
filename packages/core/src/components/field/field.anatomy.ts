import { createAnatomy } from '../../types'

/**
 * The control itself is NOT a field part. It carries its own component's scope
 * (an Input is `data-scope="input"`), so a control is styled identically inside
 * a Field and outside one. The Field contributes ids, ARIA and validation to it.
 */
export const fieldAnatomy = createAnatomy('field', ['root', 'label', 'hint', 'error'] as const)
export type FieldPart = (typeof fieldAnatomy.parts)[number]
