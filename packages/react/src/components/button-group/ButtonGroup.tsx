import type { HTMLAttributes, ReactNode } from 'react'
import { connect, type ButtonGroupProps as CoreButtonGroupProps } from '@ggary/core/button-group'
import { reactNormalizer } from '@ggary/core'
import { useConfigured } from '../config-provider'

export interface ButtonGroupProps extends CoreButtonGroupProps, HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function ButtonGroup(own: ButtonGroupProps) {
  const { size, label, children, ...rest } = useConfigured(own, { size: true })
  const api = connect({ size, label }, reactNormalizer)
  return (
    <div {...rest} {...api.rootProps}>
      {children}
    </div>
  )
}
