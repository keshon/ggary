import type { Dict, Normalizer } from '../../types'
import { headingTag } from '../../utils/region'
import { pageHeaderAnatomy } from './page-header.anatomy'
import type { PageHeaderProps } from './page-header.types'

export const pageHeaderIds = (id: string) => ({ title: `${id}-title`, description: `${id}-description` })

export function connect<T = Dict>(props: PageHeaderProps, normalize: Normalizer<T>) {
  const ids = pageHeaderIds(props.id)
  const anatomy = pageHeaderAnatomy
  return {
    ids,
    titleElement: headingTag(props.headingLevel ?? 1),
    rootProps: normalize({ ...anatomy.attrs('root'), id: props.id }),
    /** Above the title: breadcrumbs, a back link. */
    contextProps: normalize({ ...anatomy.attrs('context') }),
    mainProps: normalize({ ...anatomy.attrs('main') }),
    titleProps: normalize({
      ...anatomy.attrs('title'),
      id: ids.title,
      'aria-describedby': props.description ? ids.description : undefined,
    }),
    descriptionProps: normalize({ ...anatomy.attrs('description'), id: ids.description }),
    actionsProps: normalize({ ...anatomy.attrs('actions') }),
  }
}
