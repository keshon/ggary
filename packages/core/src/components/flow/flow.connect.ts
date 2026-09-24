import type { Dict, Normalizer } from '../../types'
import { clusterAnatomy, columnAnatomy, columnsAnatomy, containerAnatomy, flexAnatomy, flexItemAnatomy, gridAnatomy, stackAnatomy } from './flow.anatomy'
import type {
  ClusterProps,
  ColumnProps,
  ColumnsProps,
  ColumnsValue,
  ColumnsWidth,
  ContainerProps,
  FlexItemProps,
  FlexProps,
  GridProps,
  StackProps,
} from './flow.types'

/**
 * The attributes of a flexbox, which Flex, Stack and Cluster all speak: one
 * engine under three names, so a Stack is exactly a Flex column and a theme
 * styles the three with one set of rules.
 */
export function flexAttrs(props: FlexProps) {
  return {
    'data-direction': props.direction ?? 'row',
    'data-gap': props.gap ?? 'default',
    'data-align': props.align,
    'data-justify': props.justify ?? 'start',
    'data-wrap': props.wrap ? '' : undefined,
  }
}

/**
 * A column. It stretches what it holds to its width — fields, panels, cards
 * want exactly that — except what is sized by its content: a button, a badge,
 * a chip keeps its own width. The column says so on a channel its children
 * read (`--gg-flow-self`), not by knowing their names.
 */
export function connectStack<T = Dict>(props: StackProps, normalize: Normalizer<T>) {
  return { rootProps: normalize({ ...stackAnatomy.attrs('root'), ...flexAttrs({ direction: 'column', gap: props.gap }) }) }
}

/** A row that wraps, centred across: tags, a header's controls, a card's actions. */
export function connectCluster<T = Dict>(props: ClusterProps, normalize: Normalizer<T>) {
  return {
    rootProps: normalize({
      ...clusterAnatomy.attrs('root'),
      ...flexAttrs({ direction: 'row', gap: props.gap, justify: props.justify, align: 'center', wrap: true }),
    }),
    spacerProps: normalize({ ...clusterAnatomy.attrs('spacer'), 'aria-hidden': 'true' }),
  }
}

/** Any flexbox the two presets are not: a column pushed to both ends, a row that holds one line. */
export function connectFlex<T = Dict>(props: FlexProps, normalize: Normalizer<T>) {
  return { rootProps: normalize({ ...flexAnatomy.attrs('root'), ...flexAttrs(props) }) }
}

/** A child of a Flex with a share of the room. A number's share is passed as `--gg-flex-grow`. */
export function connectFlexItem<T = Dict>(props: FlexItemProps, normalize: Normalizer<T>) {
  const share = typeof props.grow === 'number' && props.grow > 0 ? props.grow : props.grow === true ? 1 : undefined
  return {
    rootProps: normalize({
      ...flexItemAnatomy.attrs('root'),
      'data-grow': share !== undefined ? '' : undefined,
      'data-shrink': props.shrink === false ? 'false' : undefined,
      'data-align': props.align,
      style: share !== undefined && share !== 1 ? { '--gg-flex-grow': String(share) } : undefined,
    }),
  }
}

/** Cards in columns that fill the width and fall to fewer as it narrows. */
export function connectGrid<T = Dict>(props: GridProps, normalize: Normalizer<T>) {
  return {
    rootProps: normalize({ ...gridAnatomy.attrs('root'), 'data-gap': props.gap ?? 'default', 'data-columns': props.columns ?? 'default' }),
  }
}

/**
 * Twelve columns, and the region its columns measure: a Columns inside a
 * column answers to that column's width, not the window's.
 */
export function connectColumns<T = Dict>(props: ColumnsProps, normalize: Normalizer<T>) {
  return {
    rootProps: normalize({ ...columnsAnatomy.attrs('root'), 'data-gap': props.gap ?? 'default', 'data-align': props.align ?? 'stretch' }),
  }
}

const WIDTHS: ColumnsWidth[] = ['base', 'narrow', 'medium', 'wide']
const line = (n: number) => Math.min(12, Math.max(1, Math.round(n)))
const perWidth = (value: ColumnsValue | undefined) => (typeof value === 'number' ? { base: value } : (value ?? {}))

/**
 * A column's span and start at each width it names, as custom properties the
 * structure layer picks among by container query; `data-span-<width>` says
 * which widths it named, so a width it did not name keeps the one before.
 */
export function connectColumn<T = Dict>(props: ColumnProps, normalize: Normalizer<T>) {
  const span = perWidth(props.span)
  const start = perWidth(props.start)
  const style: Record<string, string> = {}
  const attrs: Record<string, string> = {}
  for (const width of WIDTHS) {
    const suffix = width === 'base' ? '' : `-${width}`
    if (span[width] !== undefined) {
      style[`--gg-column-span${suffix}`] = String(line(span[width]!))
      if (width !== 'base') attrs[`data-span-${width}`] = ''
    }
    if (start[width] !== undefined) {
      style[`--gg-column-start${suffix}`] = String(line(start[width]!))
      if (width !== 'base') attrs[`data-start-${width}`] = ''
    }
  }
  return {
    rootProps: normalize({ ...columnAnatomy.attrs('root'), ...attrs, style: Object.keys(style).length ? style : undefined }),
  }
}

/**
 * The width a screen's content keeps, centred, with an inset at the sides. It
 * is also the region the components inside answer to with container queries.
 */
export function connectContainer<T = Dict>(props: ContainerProps, normalize: Normalizer<T>) {
  return { rootProps: normalize({ ...containerAnatomy.attrs('root'), 'data-size': props.size ?? 'default' }) }
}
