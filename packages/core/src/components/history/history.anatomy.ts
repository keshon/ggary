import { createAnatomy } from '../../types'

export const historyAnatomy = createAnatomy('history', ['root', 'strip', 'group', 'tick', 'axis', 'axis-cell'] as const)
export type HistoryPart = (typeof historyAnatomy.parts)[number]
