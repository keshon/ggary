import { createAnatomy } from '../../types'

export const shareAnatomy = createAnatomy('share', ['root', 'segment'] as const)
export type SharePart = (typeof shareAnatomy.parts)[number]
