import { createAnatomy } from '../../types'

export const skeletonAnatomy = createAnatomy('skeleton', ['root', 'bar'] as const)
export type SkeletonPart = (typeof skeletonAnatomy.parts)[number]
