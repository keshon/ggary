export type FlowGap = 'tight' | 'default' | 'loose'

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
