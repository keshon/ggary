import { createAnatomy } from '../../types'

export const kvAnatomy = createAnatomy('kv', ['root', 'term', 'detail'] as const)
export type KvPart = (typeof kvAnatomy.parts)[number]
