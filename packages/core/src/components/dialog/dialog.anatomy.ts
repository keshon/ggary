import { createAnatomy } from '../../types'

/**
 * `content` is the native <dialog>; header, body and footer lay it out. The
 * trigger is not a part: it belongs to whatever component renders it.
 */
export const dialogAnatomy = createAnatomy(
  'dialog',
  ['content', 'header', 'title', 'description', 'body', 'footer', 'close', 'close-icon'] as const
)
export type DialogPart = (typeof dialogAnatomy.parts)[number]
