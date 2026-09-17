import type { IconName } from '@ggary/icons'
import type { Dict, Normalizer } from '../../types'
import { liveAttrs } from '../../utils/region'
import { TONE_ICONS } from '../../utils/tone'
import { noteAnatomy } from './note.anatomy'
import type { NoteProps } from './note.types'

/**
 * An aside in the flow, explaining what it stands next to: a bar at its edge
 * and, with a tone, an icon. No heading and no actions — that is a banner.
 */
export function connect<T = Dict>(props: NoteProps, normalize: Normalizer<T>) {
  const { tone, live } = props
  return {
    showIcon: tone !== undefined,
    rootProps: normalize({ ...noteAnatomy.attrs('root'), ...liveAttrs(live), 'data-tone': tone }),
    iconProps: normalize({ ...noteAnatomy.attrs('icon'), 'data-icon': tone ? (TONE_ICONS[tone] satisfies IconName) : undefined, 'aria-hidden': 'true' }),
    bodyProps: normalize({ ...noteAnatomy.attrs('body') }),
  }
}
