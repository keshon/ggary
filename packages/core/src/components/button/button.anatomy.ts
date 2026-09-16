import { createAnatomy } from '../../types'

export const buttonAnatomy = createAnatomy('button', ['root', 'spinner'] as const)
export type ButtonPart = (typeof buttonAnatomy.parts)[number]
