import { createAnatomy } from '../../types'

/**
 * Tree view (WAI-ARIA APG): nested items one under another, a branch opened in
 * place. Drawn flat — one row per visible node, its depth, its place among its
 * siblings and their count said with `aria-level`, `aria-posinset` and
 * `aria-setsize` — so a framework renders a list, and a long tree could be
 * windowed like the grid's rows.
 */

export const treeAnatomy = createAnatomy('tree', ['root', 'item', 'toggle', 'item-text', 'item-indicator'] as const)
export type TreePart = (typeof treeAnatomy.parts)[number]
