import { createAnatomy } from '../../types'

/**
 * `copy` is the target and `copy-icon` the drawing: a mask clips everything on
 * its element, the invisible tap area included, so the glyph is a child.
 */
export const copyableAnatomy = createAnatomy('copyable', ['root', 'value', 'copy', 'copy-icon', 'live'] as const)
export type CopyablePart = (typeof copyableAnatomy.parts)[number]
