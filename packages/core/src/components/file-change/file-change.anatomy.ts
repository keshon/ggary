import { createAnatomy } from '../../types'

export const fileChangeAnatomy = createAnatomy('file-change', ['root', 'sign', 'label'] as const)
export type FileChangePart = (typeof fileChangeAnatomy.parts)[number]
