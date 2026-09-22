import type { StatusTone } from '../../utils/tone'

export interface StatusDotProps {
  /**
   * The tone, when the dot stands apart. Left out, the dot reads the tone of
   * the nearest ancestor that sets one — a Badge, a Timeline item, any
   * `data-tone` — so a tone is set once per group; with none anywhere it is
   * the neutral mark.
   */
  tone?: StatusTone
}
