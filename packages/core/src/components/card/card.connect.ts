import type { Dict, Normalizer } from '../../types'
import { headingTag } from '../../utils/region'
import { cardAnatomy } from './card.anatomy'
import type { CardProps } from './card.types'

/**
 * A bounded object: one card per item of data. A panel is a place on the
 * screen; a card is a thing in it. No machine, and no shadow: a shadow means
 * "floating and about to leave".
 */
export function connect<T = Dict>(props: CardProps, normalize: Normalizer<T>) {
  const { href, interactive = false, plain = false, rank, tone, headingLevel = 3 } = props
  return {
    /** The root's tag: a link card is an `<a>`. */
    element: href ? ('a' as const) : ('div' as const),
    titleElement: headingTag(headingLevel),
    showHeader: props.title !== undefined || props.subtitle !== undefined,
    rootProps: normalize({
      ...cardAnatomy.attrs('root'),
      href,
      'data-interactive': href || interactive ? '' : undefined,
      'data-link': href ? '' : undefined,
      'data-plain': plain ? '' : undefined,
      'data-rank': rank,
      'data-tone': tone,
    }),
    headerProps: normalize({ ...cardAnatomy.attrs('header') }),
    titleProps: normalize({ ...cardAnatomy.attrs('title') }),
    subtitleProps: normalize({ ...cardAnatomy.attrs('subtitle') }),
  }
}
