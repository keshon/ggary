import type { ReadingInput } from '../../utils/reading'
import type { StatusTone } from '../../utils/tone'

/**
 * The box the ring is drawn in, which the theme sets: `lg` beside the text of
 * a card, `md` in a row of controls, `sm` where a glyph stands.
 */
export type RingSize = 'sm' | 'md' | 'lg'

export interface RingProps extends ReadingInput {
  /** What is being measured. A ring has no text of its own, so this is spoken only, and a ring standing alone needs it. */
  label?: string
  /**
   * The same reading already stands beside the ring in words. The ring is then
   * hidden from assistive tech, which would otherwise say it twice. Default:
   * false — the honest answer for a ring standing on its own.
   */
  decorative?: boolean
  /** Draw the share as a figure at the centre. Default: only at `lg`, the one size a figure fits inside. */
  showValue?: boolean
  /** What the quantity MEANS: a threshold crossed, a limit spent. One tone for one quantity, never a series colour. */
  tone?: StatusTone
  size?: RingSize
}
