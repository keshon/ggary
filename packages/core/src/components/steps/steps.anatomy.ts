import { createAnatomy } from '../../types'

/** An ordered list: the number of a step and the total come from the list itself. */
export const stepsAnatomy = createAnatomy('steps', ['root', 'item', 'name', 'note'] as const)
export type StepsPart = (typeof stepsAnatomy.parts)[number]
