import type { IconName } from '@ggary/icons'
import type { Dict, Normalizer } from '../../types'
import { liveAttrs } from '../../utils/region'
import { TONE_ICONS } from '../../utils/tone'
import { bannerAnatomy } from './banner.anatomy'
import type { BannerProps } from './banner.types'

/**
 * A message about the whole screen: "access expires in three days",
 * "maintenance under way". It has a ground, a border, a tone icon and room for
 * an action. Not a note: a note is an aside next to what it explains.
 */
export function connect<T = Dict>(props: BannerProps, normalize: Normalizer<T>, onDismiss?: () => void) {
  const { tone, live, dismissible = false, dismissLabel = 'Dismiss' } = props
  return {
    showIcon: tone !== undefined,
    showClose: dismissible,
    rootProps: normalize({ ...bannerAnatomy.attrs('root'), ...liveAttrs(live), 'data-tone': tone }),
    iconProps: normalize({ ...bannerAnatomy.attrs('icon'), 'data-icon': tone ? (TONE_ICONS[tone] satisfies IconName) : undefined, 'aria-hidden': 'true' }),
    bodyProps: normalize({ ...bannerAnatomy.attrs('body') }),
    titleProps: normalize({ ...bannerAnatomy.attrs('title') }),
    textProps: normalize({ ...bannerAnatomy.attrs('text') }),
    actionsProps: normalize({ ...bannerAnatomy.attrs('actions') }),
    closeProps: normalize({ ...bannerAnatomy.attrs('close'), type: 'button', 'aria-label': dismissLabel, onClick: () => onDismiss?.() }),
    closeIconProps: normalize({ ...bannerAnatomy.attrs('close-icon'), 'data-icon': 'close' satisfies IconName, 'aria-hidden': 'true' }),
  }
}
