import type { StatusTone } from '../../utils/tone'

/**
 * How loudly the badge speaks, in Button's words. `medium`: a plate in the
 * tone. `low`: the tone on the border only, for a badge among glyphs where a
 * plate is the heaviest thing in the row.
 */
export type BadgeEmphasis = 'medium' | 'low'

export interface BadgeProps {
  /** A state from the kit's vocabulary. Without one, the badge is a plain label. */
  tone?: StatusTone
  /** Default: `medium`. */
  emphasis?: BadgeEmphasis
  /** A round number over a glyph, rather than a word: a solid disc, never a dot. */
  count?: boolean
  /** The state dot. Default: shown whenever there is a tone, never on a count. */
  dot?: boolean
}
