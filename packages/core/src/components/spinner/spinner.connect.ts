import type { IconName } from '@ggary/icons'
import type { Dict, Normalizer } from '../../types'
import { spinnerAnatomy } from './spinner.anatomy'
import type { SpinnerProps } from './spinner.types'

/**
 * Busy, with no amount to report. A status with a name: without the role a
 * spinner is only a picture. Track and arc are glyphs — masks of an SVG
 * circle — so the ring's centre is the viewBox's and does not wobble under
 * rotation at a fractional pixel ratio, which a border ring does.
 */
export function connect<T = Dict>(props: SpinnerProps, normalize: Normalizer<T>) {
  const { label = 'Loading', size = 'md' } = props
  return {
    rootProps: normalize({ ...spinnerAnatomy.attrs('root'), role: 'status', 'aria-label': label, 'data-size': size }),
    trackProps: normalize({ ...spinnerAnatomy.attrs('track'), 'data-icon': 'spinner-track' satisfies IconName, 'aria-hidden': 'true' }),
    arcProps: normalize({ ...spinnerAnatomy.attrs('arc'), 'data-icon': 'spinner-arc' satisfies IconName, 'aria-hidden': 'true' }),
  }
}
