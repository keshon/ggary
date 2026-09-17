/** A bar's width: `title` 40%, `line` the full width, `short` 62% — a paragraph's last line. */
export type SkeletonShape = 'title' | 'line' | 'short'

export interface SkeletonProps {
  /** Lines of text to stand in for. The last of several is short, as a paragraph's is. Default 1. */
  lines?: number
  /** A title bar above the lines. */
  title?: boolean
}
