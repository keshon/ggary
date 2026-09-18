import { createAnatomy } from '../../types'

/**
 * frame holds the grid and what must not be inside a grid: the live status
 * and the empty or error message. root is the scrolling element and the grid;
 * header and body are its two row groups; a row is placed inside the body at
 * its computed top.
 */
export const dataGridAnatomy = createAnatomy('data-grid', [
  'frame',
  'root',
  'header',
  'header-cell',
  'header-label',
  'sort',
  'resize',
  'body',
  'row',
  'cell',
  'checkbox',
  'editor',
  'editor-error',
  'placeholder',
  'status',
  'overlay',
] as const)
export type DataGridPart = (typeof dataGridAnatomy.parts)[number]
