import type { LiveMode } from '../../utils/region'
import type { StatusTone } from '../../utils/tone'

export interface NoteProps {
  tone?: StatusTone
  /** Say it as it appears, when it appears in response to something. */
  live?: LiveMode
}
