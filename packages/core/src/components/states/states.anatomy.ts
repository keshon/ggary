import { createAnatomy } from '../../types'

export const dotAnatomy = createAnatomy('dot', ['root'] as const)
export type DotPart = (typeof dotAnatomy.parts)[number]

export const caretAnatomy = createAnatomy('caret', ['root'] as const)
export type CaretPart = (typeof caretAnatomy.parts)[number]
