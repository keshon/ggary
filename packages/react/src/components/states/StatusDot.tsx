import type { HTMLAttributes } from 'react'
import { connectDot, type StatusDotProps as CoreStatusDotProps } from '@ggary/core/states'
import { reactNormalizer } from '@ggary/core'

/** No children: a dot stands beside a word, never holds one. */
export interface StatusDotProps extends CoreStatusDotProps, Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {}

export function StatusDot({ tone, ...rest }: StatusDotProps) {
  const api = connectDot({ tone }, reactNormalizer)
  return <span {...rest} {...api.rootProps} />
}
