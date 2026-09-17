import { createAnatomy } from '../../types'

/**
 * A strip of tools, plus two service parts: a line between meaningful groups,
 * and one spacer that pushes everything after it to the far edge.
 */
export const toolbarAnatomy = createAnatomy('toolbar', ['root', 'separator', 'spacer'] as const)
export type ToolbarPart = (typeof toolbarAnatomy.parts)[number]
