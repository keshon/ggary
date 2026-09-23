import { createAnatomy } from '../../types'

export const queueAnatomy = createAnatomy('queue', ['root', 'status'] as const)
export type QueuePart = (typeof queueAnatomy.parts)[number]

export const taskAnatomy = createAnatomy('task', ['root', 'gutter', 'main', 'title', 'sub', 'meta'] as const)
export type TaskPart = (typeof taskAnatomy.parts)[number]
