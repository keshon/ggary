import { createAnatomy } from '../../types'

/**
 * One exchange: who spoke and when, what was said, and the row of things that
 * can be done with it afterwards. The cost stands in the head beside the time,
 * because it is metadata about the turn rather than part of the answer.
 */
export const turnAnatomy = createAnatomy('turn', ['root', 'head', 'who', 'time', 'cost', 'body', 'actions'] as const)
export type TurnPart = (typeof turnAnatomy.parts)[number]
