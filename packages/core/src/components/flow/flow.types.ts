/** Three steps of gap named by intent, and none. A row's steps are shorter than a column's: the theme's rhythm. */
export type FlowGap = 'none' | 'tight' | 'default' | 'loose'

export interface StackProps {
  gap?: FlowGap
}

export interface ClusterProps {
  gap?: FlowGap
  /** Along the row. A ClusterSpacer sends what follows it to the far end instead. */
  justify?: 'start' | 'end' | 'between'
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

export interface ContainerProps {
  /**
   * The ceiling. `default` for a screen of panels, `narrow` for a form, `prose`
   * for reading — a line past about seventy characters loses the eye on its
   * way back — and `full` for a board that uses every pixel.
   */
  size?: 'default' | 'narrow' | 'prose' | 'full'
}

export type FlexDirection = 'row' | 'column'
export type FlexAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline'
export type FlexJustify = 'start' | 'center' | 'end' | 'between'

/**
 * The one flexbox of the kit. Stack is a Flex column that keeps what is sized
 * by its content at its own width; Cluster is a Flex row that wraps, centred.
 * Anything else — a column pushed to both ends, a row that does not wrap — is
 * a Flex.
 */
export interface FlexProps {
  /** Default `row`. */
  direction?: FlexDirection
  /** Default `default`: a column's rhythm or a row's, by direction. */
  gap?: FlowGap
  /**
   * Across the direction. Left out, the browser's stretch — except that a
   * column left out keeps what is sized by its content at its own width, as a
   * Stack does.
   */
  align?: FlexAlign
  /** Along the direction. Default `start`. */
  justify?: FlexJustify
  /** Lets a row fall onto more lines. Default false. */
  wrap?: boolean
}

/** One child of a Flex that asks for its share of the room. */
export interface FlexItemProps {
  /** `true`: takes what is left. A number: its share of what is left, against the other growing items. */
  grow?: boolean | number
  /** Default true. `false` keeps its size when the room is short. */
  shrink?: boolean
  /** Its own place across the direction, over the Flex's `align`. */
  align?: FlexAlign
}

/**
 * The widths a Columns answers to — its OWN width, by container query, not the
 * window's: the same layout holds in a page, a sheet or a pane, and a Columns
 * inside a column answers to that column. narrow ≥ 30rem, medium ≥ 48rem,
 * wide ≥ 64rem.
 */
export type ColumnsWidth = 'base' | 'narrow' | 'medium' | 'wide'

/** One number at every width, or one per width, each holding until the next one given. */
export type ColumnsValue = number | Partial<Record<ColumnsWidth, number>>

export interface ColumnsProps {
  /** Default `default`. */
  gap?: FlowGap
  /** How the columns of one row line up against each other. Default `stretch`. */
  align?: 'start' | 'center' | 'end' | 'stretch'
}

export interface ColumnProps {
  /** How many of the twelve columns it spans, 1 to 12. Default 12: a whole row. */
  span?: ColumnsValue
  /** The column line it starts at, 1 to 12 — what an offset is for. Left out, it follows the one before. */
  start?: ColumnsValue
}
