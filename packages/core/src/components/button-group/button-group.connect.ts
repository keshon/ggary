import type { Dict, Normalizer } from '../../types'
import { buttonGroupAnatomy as anatomy } from './button-group.anatomy'
import type { ButtonGroupProps } from './button-group.types'

/**
 * Several different actions standing flush. That is the whole difference from
 * a SegmentedControl: a group has no chosen one and cannot have.
 *
 * No roving tabindex, deliberately: Tab goes through every button, because
 * these are separate actions rather than one value. A roving tabindex here
 * would hide half of them from the keyboard. A group takes a role only when it
 * is named — an unnamed group is an announcement that says nothing.
 */
export function connect<T = Dict>(props: ButtonGroupProps, normalize: Normalizer<T>) {
  const { size = 'md', label } = props
  return {
    rootProps: normalize({
      ...anatomy.attrs('root'),
      role: label ? 'group' : undefined,
      'aria-label': label,
      'data-size': size,
    }),
  }
}
