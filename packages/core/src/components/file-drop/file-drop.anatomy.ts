import { createAnatomy } from '../../types'

/** The zone IS the <label>: a press anywhere in it opens the system dialog. */
export const fileDropAnatomy = createAnatomy('file-drop', ['root', 'icon', 'input', 'text', 'hint', 'files'] as const)
export type FileDropPart = (typeof fileDropAnatomy.parts)[number]
