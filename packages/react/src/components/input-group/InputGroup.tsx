import type { HTMLAttributes, ReactNode } from 'react'
import { connect, type InputGroupProps as CoreInputGroupProps } from '@ggary/core/input-group'
import { reactNormalizer } from '@ggary/core'

export interface InputGroupProps extends CoreInputGroupProps, Omit<HTMLAttributes<HTMLDivElement>, 'prefix'> {
  children: ReactNode
}

export function InputGroup({ prefix, suffix, size, disabled, invalid, children, ...rest }: InputGroupProps) {
  const api = connect({ prefix, suffix, size, disabled, invalid }, reactNormalizer)
  return (
    <div {...rest} {...api.rootProps}>
      {api.showPrefix && <span {...api.prefixProps}>{api.prefix}</span>}
      {children}
      {api.showSuffix && <span {...api.suffixProps}>{api.suffix}</span>}
    </div>
  )
}
