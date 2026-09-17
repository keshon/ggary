import type { ReactNode } from 'react'
import { connect, type NoteProps as CoreNoteProps } from '@ggary/core/note'
import { reactNormalizer } from '@ggary/core'

export interface NoteProps extends CoreNoteProps {
  children?: ReactNode
}

export function Note({ tone, live, children }: NoteProps) {
  const api = connect({ tone, live }, reactNormalizer)
  return (
    <div {...api.rootProps}>
      {api.showIcon && <span {...api.iconProps} />}
      <div {...api.bodyProps}>{children}</div>
    </div>
  )
}
