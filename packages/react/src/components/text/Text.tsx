import { createElement, type HTMLAttributes, type ReactNode } from 'react'
import { connect, type TextProps as CoreTextProps } from '@ggary/core/text'
import { reactNormalizer } from '@ggary/core'

export interface TextProps extends CoreTextProps, HTMLAttributes<HTMLElement> {
  children?: ReactNode
}

export function Text({ tone, emphasis, strong, code, kbd, mark, deleted, truncate, children, ...rest }: TextProps) {
  const api = connect({ tone, emphasis, strong, code, kbd, mark, deleted, truncate }, reactNormalizer)
  return createElement(api.element, { ...rest, ...api.rootProps }, children)
}
