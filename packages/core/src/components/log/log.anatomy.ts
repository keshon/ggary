import { createAnatomy } from '../../types'

export const logAnatomy = createAnatomy('log', ['root', 'line', 'time', 'level', 'message'] as const)
export type LogPart = (typeof logAnatomy.parts)[number]
