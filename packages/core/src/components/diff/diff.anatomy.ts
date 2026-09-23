import { createAnatomy } from '../../types'

/**
 * The mark of what became of the file is NOT a part of a diff: the kit's
 * FileChange goes in the header, before the path.
 */
export const diffAnatomy = createAnatomy('diff', [
  'root',
  'head',
  'path',
  'stat',
  'added',
  'removed',
  'body',
  'row',
  'num',
  'code',
  'fold',
] as const)
export type DiffPart = (typeof diffAnatomy.parts)[number]
