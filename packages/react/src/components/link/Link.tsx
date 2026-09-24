import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { connect, type LinkProps as CoreLinkProps, type LinkWords } from '@ggary/core/link'
import { reactNormalizer } from '@ggary/core'

export interface LinkProps extends CoreLinkProps, AnchorHTMLAttributes<HTMLAnchorElement> {
  children?: ReactNode
  words?: LinkWords
}

export function Link({ external, words, children, ...rest }: LinkProps) {
  const api = connect({ external }, reactNormalizer, { words })
  return (
    <a {...rest} {...api.rootProps}>
      {children}
      {api.external && (
        <>
          <span {...api.iconProps} />
          <span {...api.hintProps}>{api.hintText}</span>
        </>
      )}
    </a>
  )
}
