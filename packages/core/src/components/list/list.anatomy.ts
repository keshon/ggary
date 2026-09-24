import { createAnatomy } from '../../types'

/**
 * A list of things, each a row: something at the start (an avatar, an icon),
 * a title and a line under it, what is known about it at the end (a badge, a
 * time), and its actions. A heading over the rows, and a footer under them
 * that can load more.
 *
 * A row that goes somewhere is one target: its title is the link or the
 * button (`target`), stretched over the whole row, so the row is pressed
 * anywhere and read by its title; the actions stand above the stretch and
 * stay targets of their own.
 */
export const listAnatomy = createAnatomy('list', [
  'root',
  'header',
  'title',
  'count',
  'items',
  'item',
  'leading',
  'body',
  'target',
  'item-title',
  'description',
  'meta',
  'actions',
  'footer',
  'more',
  'more-error',
] as const)
export type ListPart = (typeof listAnatomy.parts)[number]
