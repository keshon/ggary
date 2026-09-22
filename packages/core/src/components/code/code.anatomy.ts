import { createAnatomy } from '../../types'

/**
 * The frame holds the copy button and the live region; `content` is what
 * scrolls. Two elements because an absolute child of a scroller scrolls with
 * it, and the button has to stay in the corner while a long line moves.
 */
export const codeAnatomy = createAnatomy('code', [
  'root',
  'content',
  'line',
  'line-number',
  'line-source',
  'copy',
  'copy-icon',
  'live',
] as const)
export type CodePart = (typeof codeAnatomy.parts)[number]
