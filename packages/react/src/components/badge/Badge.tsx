import type { HTMLAttributes, ReactNode } from 'react'
import { connect, type BadgeProps as CoreBadgeProps } from '@ggary/core/badge'
import { reactNormalizer } from '@ggary/core'

export interface BadgeProps extends CoreBadgeProps, HTMLAttributes<HTMLSpanElement> {
  /** The word. A state is always named, never only coloured. */
  children?: ReactNode
}

export function Badge({ tone, variant, dot, children, ...rest }: BadgeProps) {
  const api = connect({ tone, variant, dot }, reactNormalizer)
  return (
    <span {...api.rootProps} {...rest}>
      {api.showDot && <span {...api.dotProps} />}
      {children}
    </span>
  )
}
