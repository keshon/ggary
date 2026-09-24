import type { StatusTone } from '../../utils/tone'

/** How loudly it reads, in Badge's words. `low`: secondary text, in the muted ink. Default `medium`. */
export type TextEmphasis = 'medium' | 'low'

export interface TextProps {
  /** A state's ink — for text that says a state, beside the word that names it. */
  tone?: StatusTone
  emphasis?: TextEmphasis
  strong?: boolean
  /** A piece of code in the line: <code>. */
  code?: boolean
  /** A key to press: <kbd>. */
  kbd?: boolean
  /** Picked out, as a search match is: <mark>. */
  mark?: boolean
  /** No longer so: <del>. */
  deleted?: boolean
  /** `true`: one line, cut with an ellipsis. A number: that many lines. */
  truncate?: boolean | number
}

export type TextElement = 'span' | 'strong' | 'code' | 'kbd' | 'mark' | 'del'
