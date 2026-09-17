import { createAnatomy } from '../../types'

export const noteAnatomy = createAnatomy('note', ['root', 'icon', 'body'] as const)
export type NotePart = (typeof noteAnatomy.parts)[number]
