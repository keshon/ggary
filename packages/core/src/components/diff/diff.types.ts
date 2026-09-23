import type { FileChangeKind } from '../file-change/file-change.types'

/**
 * What became of a line. An axis of its own rather than a tone: an added line
 * is not in the "ok" state, it belongs to the kind "addition", and a tone
 * would lie about the meaning. A line with no kind is context, which is the
 * right default.
 */
export type DiffKind = 'add' | 'del' | 'context'

export interface DiffLine {
  kind: DiffKind
  text: string
  /** Its number in the old file. A line that was added has none. */
  before?: number
  /** Its number in the new file. A line that was deleted has none. */
  after?: number
}

/** A stretch of unchanged lines the view does not show, and how many there were. */
export interface DiffFold {
  kind: 'fold'
  count: number
}

export type DiffRow = DiffLine | DiffFold

export interface DiffProps {
  /** The file. Truncated from the start in the header, whole in its `title`. */
  path: string
  /** What became of the file, for the mark in the header. The adapter draws it with FileChange. */
  change?: FileChangeKind
  /**
   * The rows, already worked out — from a patch the server sent, from git.
   * Given these, nothing is computed: an application that already has a diff
   * must not be made to diff again.
   */
  rows?: DiffRow[]
  /** The file before. With `after`, and without `rows`, the rows are worked out here. */
  before?: string
  /** The file after. */
  after?: string
  /**
   * How many unchanged lines to keep on each side of a change; the rest
   * become a fold that names how many were skipped. Default 3. `Infinity`
   * shows the file entire.
   */
  context?: number
  /** For the figures in the statistics and in a fold. Default: the page's. */
  locale?: string
}

/** The diff's fixed text. Everything else comes from the file. */
export interface DiffWords {
  /** A skipped stretch. Default: "18 lines skipped". */
  fold?: (count: string) => string
  /** The count of added lines. Default: "+3". */
  added?: (count: string) => string
  /** The count of deleted lines. Default: "−2" — a minus sign, not a hyphen. */
  removed?: (count: string) => string
  /** The name of the scrolling body. Default: the path. */
  region?: (path: string) => string
}
