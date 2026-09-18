import { createAnatomy } from '../../types'

/** root is the frame; two panes with the separator between them; the handle is the grip drawn on the separator. */
export const splitAnatomy = createAnatomy('split', ['root', 'pane', 'separator', 'handle'] as const)
export type SplitPart = (typeof splitAnatomy.parts)[number]
