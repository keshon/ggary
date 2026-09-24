import type { HTMLAttributes } from 'react'
import { connect, type DividerProps as CoreDividerProps } from '@ggary/core/divider'
import { reactNormalizer } from '@ggary/core'

export interface DividerProps extends CoreDividerProps, Omit<HTMLAttributes<HTMLDivElement>, 'children'> {}

export function Divider({ orientation, label, align, emphasis, ...rest }: DividerProps) {
  const api = connect({ orientation, label, align, emphasis }, reactNormalizer)
  return <div {...rest} {...api.rootProps}>{api.label && <span {...api.labelProps}>{api.label}</span>}</div>
}
