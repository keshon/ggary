import { createAnatomy } from '../../types'

export const panelAnatomy = createAnatomy('panel', ['root', 'header', 'title', 'actions', 'body'] as const)
export type PanelPart = (typeof panelAnatomy.parts)[number]
