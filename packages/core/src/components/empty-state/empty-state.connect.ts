import type { Dict, Normalizer } from '../../types'
import { headingTag, liveAttrs } from '../../utils/region'
import { emptyStateAnatomy } from './empty-state.anatomy'
import type { EmptyStateProps } from './empty-state.types'

/** A region with nothing to show yet: why, and the next step. The meaning is in the words, not in a picture. */
export function connect<T = Dict>(props: EmptyStateProps, normalize: Normalizer<T>) {
  const { headingLevel, live } = props
  return {
    titleElement: headingLevel ? headingTag(headingLevel) : ('p' as const),
    rootProps: normalize({ ...emptyStateAnatomy.attrs('root'), ...liveAttrs(live) }),
    titleProps: normalize({ ...emptyStateAnatomy.attrs('title') }),
    descriptionProps: normalize({ ...emptyStateAnatomy.attrs('description') }),
    actionsProps: normalize({ ...emptyStateAnatomy.attrs('actions') }),
  }
}
