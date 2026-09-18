import type { Dict, Normalizer } from '../../types'
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

export type FlowGap = 'tight' | 'default' | 'loose'

export const stackAnatomy = createAnatomy('stack', ['root'] as const)
export const clusterAnatomy = createAnatomy('cluster', ['root', 'spacer'] as const)
export const gridAnatomy = createAnatomy('grid', ['root'] as const)
export const containerAnatomy = createAnatomy('container', ['root'] as const)

export interface StackProps {
  gap?: FlowGap
}

/**
 * A column. It stretches what it holds to its width — fields, panels, cards
 * want exactly that — except what is sized by its content: a button, a badge,
 * a chip keeps its own width. The column says so on a channel its children
 * read (`--gg-flow-self`), not by knowing their names.
 */
export function connectStack<T = Dict>(props: StackProps, normalize: Normalizer<T>) {
  return { rootProps: normalize({ ...stackAnatomy.attrs('root'), 'data-gap': props.gap ?? 'default' }) }
}

export interface ClusterProps {
  gap?: FlowGap
  /** Along the row. A ClusterSpacer sends what follows it to the far end instead. */
  justify?: 'start' | 'end' | 'between'
}

/** A row that wraps: tags, a header's controls, a card's actions. */
export function connectCluster<T = Dict>(props: ClusterProps, normalize: Normalizer<T>) {
  return {
    rootProps: normalize({ ...clusterAnatomy.attrs('root'), 'data-gap': props.gap ?? 'default', 'data-justify': props.justify ?? 'start' }),
    spacerProps: normalize({ ...clusterAnatomy.attrs('spacer'), 'aria-hidden': 'true' }),
  }
}

export interface GridProps {
  gap?: FlowGap
  /**
   * How narrow a column may get before the grid has one fewer: `tight` for
   * small tiles, `wide` for cards with a table in them. It reflows by itself,
   * with no breakpoint.
   */
  columns?: 'tight' | 'default' | 'wide'
}

/** Cards in columns that fill the width and fall to fewer as it narrows. */
export function connectGrid<T = Dict>(props: GridProps, normalize: Normalizer<T>) {
  return {
    rootProps: normalize({ ...gridAnatomy.attrs('root'), 'data-gap': props.gap ?? 'default', 'data-columns': props.columns ?? 'default' }),
  }
}

export interface ContainerProps {
  /**
   * The ceiling. `default` for a screen of panels, `narrow` for a form, `prose`
   * for reading — a line past about seventy characters loses the eye on its
   * way back — and `full` for a board that uses every pixel.
   */
  size?: 'default' | 'narrow' | 'prose' | 'full'
}

/**
 * The width a screen's content keeps, centred, with an inset at the sides. It
 * is also the region the components inside answer to with container queries.
 */
export function connectContainer<T = Dict>(props: ContainerProps, normalize: Normalizer<T>) {
  return { rootProps: normalize({ ...containerAnatomy.attrs('root'), 'data-size': props.size ?? 'default' }) }
}
