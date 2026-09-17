import { createAnatomy } from '../../types'

/** One part: the buttons inside stay buttons, with their own scope. */
export const buttonGroupAnatomy = createAnatomy('button-group', ['root'] as const)
export type ButtonGroupPart = (typeof buttonGroupAnatomy.parts)[number]
