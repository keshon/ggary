import type { HTMLAttributes } from 'react'
import { connect, type IconProps as CoreIconProps } from '@ggary/core/icon'
import { mergeProps, reactNormalizer } from '@ggary/core'

export interface IconProps extends CoreIconProps, Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {}

/** A glyph where the app puts one: decorative, or named with `label`. */
export function Icon({ name, label, size, ...rest }: IconProps) {
  const api = connect({ name, label, size }, reactNormalizer)
  return <span {...mergeProps(rest, api.rootProps)} />
}
