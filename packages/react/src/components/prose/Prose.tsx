import type { HTMLAttributes, ReactNode } from 'react'
import { connect, type ProseProps as CoreProseProps } from '@ggary/core/prose'
import { reactNormalizer } from '@ggary/core'

/** Children, or authored HTML through `dangerouslySetInnerHTML` — a markdown renderer's output. */
export interface ProseProps extends CoreProseProps, HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
}

export function Prose({ size, children, ...rest }: ProseProps) {
  const api = connect({ size }, reactNormalizer)
  return (
    <div {...rest} {...api.rootProps}>
      {children}
    </div>
  )
}
