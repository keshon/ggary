import type { IconName } from '@ggary/icons'
import type { Dict, Normalizer } from '../../types'
import { linkAnatomy } from './link.anatomy'
import type { LinkProps, LinkWords } from './link.types'

export function connect<T = Dict>(props: LinkProps, normalize: Normalizer<T>, options: { words?: LinkWords } = {}) {
  const { words = {} } = options
  const external = props.external === true
  return {
    external,
    hintText: words.external ?? '(opens in a new tab)',
    rootProps: normalize({
      ...linkAnatomy.attrs('root'),
      'data-external': external ? '' : undefined,
      target: external ? '_blank' : undefined,
      // noopener: the new tab cannot reach back into this one; noreferrer: nor learn where it came from.
      rel: external ? 'noopener noreferrer' : undefined,
    }),
    iconProps: normalize({ ...linkAnatomy.attrs('icon'), 'data-icon': 'external' satisfies IconName, 'aria-hidden': 'true' }),
    hintProps: normalize({ ...linkAnatomy.attrs('hint') }),
  }
}
