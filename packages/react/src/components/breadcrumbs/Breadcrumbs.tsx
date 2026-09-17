import { createElement, type HTMLAttributes } from 'react'
import { connect, type BreadcrumbsProps as CoreBreadcrumbsProps } from '@ggary/core/breadcrumbs'
import { reactNormalizer } from '@ggary/core'

export interface BreadcrumbsProps extends CoreBreadcrumbsProps, Omit<HTMLAttributes<HTMLElement>, 'children'> {}

export function Breadcrumbs({ items, label, ...rest }: BreadcrumbsProps) {
  const api = connect({ items, label }, reactNormalizer)
  return (
    <nav {...rest} {...api.rootProps}>
      <ol {...api.listProps}>
        {items.map((item, index) => {
          const parts = api.getItemProps(item, index)
          return (
            <li key={`${item.label}-${index}`} {...parts.itemProps}>
              {createElement(parts.element, parts.linkProps, item.label)}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
