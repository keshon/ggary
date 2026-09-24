import type { ReactNode } from 'react'
import { connect, type ResultProps as CoreResultProps } from '@ggary/core/result'
import { reactNormalizer } from '@ggary/core'

export interface ResultProps extends CoreResultProps {
  /** The next step: a button or two. */
  actions?: ReactNode
  /** Detail under the next step: what failed, a reference number. */
  children?: ReactNode
}

export function Result({ tone, title, description, code, headingLevel, live, actions, children }: ResultProps) {
  const api = connect({ tone, title, description, code, headingLevel, live }, reactNormalizer)
  const Title = api.titleElement
  return (
    <div {...api.rootProps}>
      {api.showCode ? <span {...api.codeProps}>{code}</span> : <span {...api.iconProps} />}
      <Title {...api.titleProps}>{title}</Title>
      {description !== undefined && <p {...api.descriptionProps}>{description}</p>}
      {actions != null && <div {...api.actionsProps}>{actions}</div>}
      {children != null && <div {...api.detailsProps}>{children}</div>}
    </div>
  )
}
