import type { HTMLAttributes, ReactNode } from 'react'
import { connect, type CardProps as CoreCardProps } from '@ggary/core/card'
import { reactNormalizer } from '@ggary/core'

export interface CardProps extends CoreCardProps, Omit<HTMLAttributes<HTMLElement>, 'title'> {
  children?: ReactNode
}

export function Card({ title, subtitle, headingLevel, href, interactive, plain, rank, tone, children, ...rest }: CardProps) {
  const api = connect({ title, subtitle, headingLevel, href, interactive, plain, rank, tone }, reactNormalizer)
  const Root = api.element
  const Title = api.titleElement
  return (
    <Root {...api.rootProps} {...rest}>
      {api.showHeader && (
        <div {...api.headerProps}>
          {title !== undefined && <Title {...api.titleProps}>{title}</Title>}
          {subtitle !== undefined && <p {...api.subtitleProps}>{subtitle}</p>}
        </div>
      )}
      {children}
    </Root>
  )
}
