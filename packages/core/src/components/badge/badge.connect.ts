import type { Dict, Normalizer } from '../../types'
import { badgeAnatomy } from './badge.anatomy'
import type { BadgeProps } from './badge.types'

/**
 * A state as a word, with a dot: colour is never the only carrier, so the word
 * is the badge's content and the dot repeats the tone as a mark. No machine.
 */
export function connect<T = Dict>(props: BadgeProps, normalize: Normalizer<T>) {
  const { tone, variant = 'solid' } = props
  const dot = props.dot ?? (tone !== undefined && variant !== 'count')
  return {
    showDot: dot,
    rootProps: normalize({ ...badgeAnatomy.attrs('root'), 'data-tone': tone, 'data-variant': variant }),
    dotProps: normalize({ ...badgeAnatomy.attrs('dot'), 'aria-hidden': 'true' }),
  }
}
