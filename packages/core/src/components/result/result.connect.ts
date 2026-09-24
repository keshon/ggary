import type { IconName } from '@ggary/icons'
import type { Dict, Normalizer } from '../../types'
import { headingTag, liveAttrs } from '../../utils/region'
import { TONE_ICONS } from '../../utils/tone'
import { resultAnatomy } from './result.anatomy'
import type { ResultProps } from './result.types'

export function connect<T = Dict>(props: ResultProps, normalize: Normalizer<T>) {
  const { tone = 'neutral', code, headingLevel = 2, live } = props
  return {
    showCode: code !== undefined && code !== '',
    titleElement: headingTag(headingLevel),
    rootProps: normalize({ ...resultAnatomy.attrs('root'), ...liveAttrs(live), 'data-tone': tone }),
    iconProps: normalize({ ...resultAnatomy.attrs('icon'), 'data-icon': TONE_ICONS[tone] satisfies IconName, 'aria-hidden': 'true' }),
    codeProps: normalize({ ...resultAnatomy.attrs('code'), 'aria-hidden': 'true' }),
    titleProps: normalize({ ...resultAnatomy.attrs('title') }),
    descriptionProps: normalize({ ...resultAnatomy.attrs('description') }),
    actionsProps: normalize({ ...resultAnatomy.attrs('actions') }),
    detailsProps: normalize({ ...resultAnatomy.attrs('details') }),
  }
}
