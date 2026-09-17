import type { HTMLAttributes, ReactNode } from 'react'
import { connect, type ButtonGroupProps as CoreButtonGroupProps } from '@ggary/core/button-group'
import { reactNormalizer } from '@ggary/core'

export interface ButtonGroupProps extends CoreButtonGroupProps, HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function ButtonGroup({ size, label, children, ...rest }: ButtonGroupProps) {
  const api = connect({ size, label }, reactNormalizer)
  return (
    <div {...rest} {...api.rootProps}>
      {children}
    </div>
  )
}
