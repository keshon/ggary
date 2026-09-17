import type { ReactNode } from 'react'
import { connect, type EmptyStateProps as CoreEmptyStateProps } from '@ggary/core/empty-state'
import { reactNormalizer } from '@ggary/core'

export interface EmptyStateProps extends CoreEmptyStateProps {
  /** The next step: usually one button. */
  children?: ReactNode
}

export function EmptyState({ title, description, headingLevel, live, children }: EmptyStateProps) {
  const api = connect({ title, description, headingLevel, live }, reactNormalizer)
  const Title = api.titleElement
  return (
    <div {...api.rootProps}>
      <Title {...api.titleProps}>{title}</Title>
      {description !== undefined && <p {...api.descriptionProps}>{description}</p>}
      {children !== undefined && <div {...api.actionsProps}>{children}</div>}
    </div>
  )
}
