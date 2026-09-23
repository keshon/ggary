import { createAnatomy } from '../../types'

export const runAnatomy = createAnatomy('run', ['root', 'units', 'value'] as const)
export type RunPart = (typeof runAnatomy.parts)[number]
