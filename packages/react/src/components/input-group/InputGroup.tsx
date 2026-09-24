import type { HTMLAttributes, ReactNode } from 'react'
import { connect, type InputGroupProps as CoreInputGroupProps } from '@ggary/core/input-group'
import { reactNormalizer } from '@ggary/core'
import { useConfigured } from '../config-provider'

export interface InputGroupProps extends CoreInputGroupProps, Omit<HTMLAttributes<HTMLDivElement>, 'prefix'> {
  children: ReactNode
}

export function InputGroup(own: InputGroupProps) {
  const { prefix, suffix, size, disabled, invalid, children, ...rest } = useConfigured(own, { size: true })
  const api = connect({ prefix, suffix, size, disabled, invalid }, reactNormalizer)
  return (
    <div {...rest} {...api.rootProps}>
      {api.showPrefix && <span {...api.prefixProps}>{api.prefix}</span>}
      {children}
      {api.showSuffix && <span {...api.suffixProps}>{api.suffix}</span>}
    </div>
  )
}
