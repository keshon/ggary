import { createAnatomy } from '../../types'

/**
 * root is the grid; aside the side column (brand and navigation); header the
 * strip over the work area, which holds the drawer's toggle; main the work
 * area; footer the status strip along the bottom.
 */
export const shellAnatomy = createAnatomy('shell', [
  'root',
  'skip-link',
  'aside',
  'brand',
  'header',
  'toggle',
  'toggle-icon',
  'main',
  'footer',
] as const)
export type ShellPart = (typeof shellAnatomy.parts)[number]
