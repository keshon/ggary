import { createAnatomy } from '../../types'

export const insertsAnatomy = createAnatomy('inserts', ['root', 'item'] as const)
export type InsertsPart = (typeof insertsAnatomy.parts)[number]
