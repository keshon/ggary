import { createAnatomy } from '../../types'

/** One part: the native <textarea> itself. */
export const textareaAnatomy = createAnatomy('textarea', ['root'] as const)
export type TextareaPart = (typeof textareaAnatomy.parts)[number]
