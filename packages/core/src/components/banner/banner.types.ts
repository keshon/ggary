import type { LiveMode } from '../../utils/region'
import type { StatusTone } from '../../utils/tone'

export interface BannerProps {
  tone?: StatusTone
  title?: string
  /**
   * Say it as it appears: `polite`, or `alert` for a refusal. Off by default:
   * only the page knows whether the banner just appeared or was there on load.
   */
  live?: LiveMode
  /** A close button. Closing does not change the state it reports; the owner decides what closing means. */
  dismissible?: boolean
  dismissLabel?: string
}
