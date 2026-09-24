import { createAnatomy } from '../../types'

/**
 * The flow primitives: a column, a wrapping row, a grid of cards, and the
 * ceiling on width. Three steps of gap each, named by intent rather than by
 * number — Instrument's refusal of `mt-3` utilities, kept: a scale thinned out
 * on purpose does not come back as two hundred spacing classes.
 *
 * None of them holds state. They are here so a screen has a layout of the
 * kit's own instead of a new one each time, and so a theme can give the gaps
 * its own rhythm.
 */

export const stackAnatomy = createAnatomy('stack', ['root'] as const)
export const clusterAnatomy = createAnatomy('cluster', ['root', 'spacer'] as const)
export const gridAnatomy = createAnatomy('grid', ['root'] as const)
export const containerAnatomy = createAnatomy('container', ['root'] as const)
export const flexAnatomy = createAnatomy('flex', ['root'] as const)
export const flexItemAnatomy = createAnatomy('flex-item', ['root'] as const)
export const columnsAnatomy = createAnatomy('columns', ['root'] as const)
export const columnAnatomy = createAnatomy('column', ['root'] as const)
