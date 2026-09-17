import { createAnatomy } from '../../types'

export const emptyStateAnatomy = createAnatomy('empty-state', ['root', 'title', 'description', 'actions'] as const)
export type EmptyStatePart = (typeof emptyStateAnatomy.parts)[number]
