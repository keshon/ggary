import type { Dict, Normalizer } from '../../types'
import { headingTag } from '../../utils/region'
import { sectionAnatomy } from './section.anatomy'
import type { SectionProps } from './section.types'

export const sectionIds = (id: string) => ({ title: `${id}-title`, description: `${id}-description` })

export function connect<T = Dict>(props: SectionProps, normalize: Normalizer<T>) {
  const ids = sectionIds(props.id)
  const titled = props.title !== undefined
  const anatomy = sectionAnatomy
  return {
    ids,
    titleElement: headingTag(props.headingLevel ?? 2),
    rootProps: normalize({
      ...anatomy.attrs('root'),
      id: props.id,
      role: props.region ? 'region' : undefined,
      'aria-labelledby': props.region && titled ? ids.title : undefined,
      'aria-describedby': props.region && props.description ? ids.description : undefined,
      'data-rank': props.rank,
    }),
    headerProps: normalize({ ...anatomy.attrs('header') }),
    titleProps: normalize({ ...anatomy.attrs('title'), id: ids.title }),
    descriptionProps: normalize({ ...anatomy.attrs('description'), id: ids.description }),
    actionsProps: normalize({ ...anatomy.attrs('actions') }),
    bodyProps: normalize({ ...anatomy.attrs('body') }),
  }
}
