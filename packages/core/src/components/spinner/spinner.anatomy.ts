import { createAnatomy } from '../../types'

export const spinnerAnatomy = createAnatomy('spinner', ['root', 'track', 'arc'] as const)
export type SpinnerPart = (typeof spinnerAnatomy.parts)[number]
