export interface ThinkingProps {
  /** The ids of the button and the region are built from it. */
  id: string
  /** Whether the reasoning is shown. The adapter holds it; collapsed is the resting state. */
  open?: boolean
  /**
   * The reasoning is still arriving. The summary says so instead of naming a
   * duration it does not have yet, the region goes `aria-busy`, and the caret
   * belongs at the end of the body.
   */
  streaming?: boolean
  /** How long it took, in seconds. The one fact about thinking worth a line while it is shut. */
  duration?: number
  /** For the duration. Default: the page's. */
  locale?: string
  disabled?: boolean
}

/** The summary line, in words. */
export interface ThinkingWords {
  /** While it is still arriving. Default "Thinking…". */
  thinking?: string
  /** With a duration. Default `(d) => \`Thought for ${d}\``. */
  thoughtFor?: (duration: string) => string
  /** With no duration and nothing arriving. Default "Thought". */
  thought?: string
  /** The unit after the duration. Default "s". */
  seconds?: string
}
