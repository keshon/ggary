import type { Dict, Normalizer } from '../../types'
import { headingTag } from '../../utils/region'
import { panelAnatomy } from './panel.anatomy'
import type { PanelProps } from './panel.types'

export const panelIds = (id: string) => ({ title: `${id}-title`, body: `${id}-body` })

/**
 * A region of the application: a named place with a header and a body that
 * holds its position. Its width comes from outside — it is an inline-size
 * container, so what is inside answers to the panel, not to the window.
 */
export function connect<T = Dict>(props: PanelProps & { id: string }, normalize: Normalizer<T>) {
  const { id, title, headingLevel = 2, body = 'padded', plain = false, rank, tone, region = false, scrollable = false } = props
  const ids = panelIds(id)
  const titled = title !== undefined
  return {
    ids,
    titleElement: headingTag(headingLevel),
    rootProps: normalize({
      ...panelAnatomy.attrs('root'),
      role: region ? 'region' : undefined,
      'aria-labelledby': region && titled ? ids.title : undefined,
      'data-plain': plain ? '' : undefined,
      'data-rank': rank,
      'data-tone': tone,
    }),
    headerProps: normalize({ ...panelAnatomy.attrs('header') }),
    titleProps: normalize({ ...panelAnatomy.attrs('title'), id: ids.title }),
    actionsProps: normalize({ ...panelAnatomy.attrs('actions') }),
    bodyProps: normalize({
      ...panelAnatomy.attrs('body'),
      id: ids.body,
      'data-body': body,
      // A scrolling area with nothing focusable in it is out of the keyboard's reach otherwise.
      tabIndex: scrollable ? 0 : undefined,
      role: scrollable ? 'group' : undefined,
      'aria-labelledby': scrollable && titled ? ids.title : undefined,
    }),
  }
}
