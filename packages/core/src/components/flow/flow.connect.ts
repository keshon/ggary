import type { Dict, Normalizer } from '../../types'
import { clusterAnatomy, containerAnatomy, gridAnatomy, stackAnatomy } from './flow.anatomy'
import type { ClusterProps, ContainerProps, GridProps, StackProps } from './flow.types'

/**
 * A column. It stretches what it holds to its width — fields, panels, cards
 * want exactly that — except what is sized by its content: a button, a badge,
 * a chip keeps its own width. The column says so on a channel its children
 * read (`--gg-flow-self`), not by knowing their names.
 */
export function connectStack<T = Dict>(props: StackProps, normalize: Normalizer<T>) {
  return { rootProps: normalize({ ...stackAnatomy.attrs('root'), 'data-gap': props.gap ?? 'default' }) }
}

/** A row that wraps: tags, a header's controls, a card's actions. */
export function connectCluster<T = Dict>(props: ClusterProps, normalize: Normalizer<T>) {
  return {
    rootProps: normalize({ ...clusterAnatomy.attrs('root'), 'data-gap': props.gap ?? 'default', 'data-justify': props.justify ?? 'start' }),
    spacerProps: normalize({ ...clusterAnatomy.attrs('spacer'), 'aria-hidden': 'true' }),
  }
}

/** Cards in columns that fill the width and fall to fewer as it narrows. */
export function connectGrid<T = Dict>(props: GridProps, normalize: Normalizer<T>) {
  return {
    rootProps: normalize({ ...gridAnatomy.attrs('root'), 'data-gap': props.gap ?? 'default', 'data-columns': props.columns ?? 'default' }),
  }
}

/**
 * The width a screen's content keeps, centred, with an inset at the sides. It
 * is also the region the components inside answer to with container queries.
 */
export function connectContainer<T = Dict>(props: ContainerProps, normalize: Normalizer<T>) {
  return { rootProps: normalize({ ...containerAnatomy.attrs('root'), 'data-size': props.size ?? 'default' }) }
}
