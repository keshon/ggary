import { createAnatomy } from '../../types'

/**
 * A regular table: native table elements, a finite set of rows, one
 * client-side sort key and an optional checkbox column. What answers a query
 * — filters, a server, a viewport — stays in DataGrid; this is the table for
 * everything that fits on the screen at once.
 */
export const tableAnatomy = createAnatomy('table', [
  'root',
  'caption',
  'header',
  'header-row',
  'header-cell',
  'sort',
  'sort-icon',
  'body',
  'row',
  'cell',
  'empty',
] as const)

export type TablePart = (typeof tableAnatomy.parts)[number]
