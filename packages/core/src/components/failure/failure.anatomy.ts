import { createAnatomy } from '../../types'

/**
 * The same shape as an approval's, with a different content: a head, a machine
 * string on a plate, a quiet list, the way out, and the record that stays once
 * the block has stepped back. The two are one family and are laid out alike.
 */
export const failureAnatomy = createAnatomy('failure', ['root', 'head', 'icon', 'title', 'reason', 'tried', 'attempt', 'actions', 'verdict'] as const)
export type FailurePart = (typeof failureAnatomy.parts)[number]
