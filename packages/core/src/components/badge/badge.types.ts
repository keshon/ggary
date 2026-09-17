import type { StatusTone } from '../../utils/tone'

/**
 * `solid`: a plate in the tone. `outline`: the tone on the border only, for a
 * badge among glyphs where a plate is the heaviest thing in the row. `count`:
 * a round number over a glyph.
 */
export type BadgeVariant = 'solid' | 'outline' | 'count'

export interface BadgeProps {
  /** A state from the kit's vocabulary. Without one, the badge is a plain label. */
  tone?: StatusTone
  variant?: BadgeVariant
  /** The state dot. Default: shown whenever there is a tone, never on a count. */
  dot?: boolean
}
