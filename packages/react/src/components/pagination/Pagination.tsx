import { createElement, type HTMLAttributes } from 'react'
import { connect, type PaginationProps as CorePaginationProps } from '@ggary/core/pagination'
import { reactNormalizer } from '@ggary/core'

export interface PaginationProps extends CorePaginationProps, Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** The page behind the link that was pressed. Call preventDefault to keep the page. */
  onPageChange?: (page: number, event: Event) => void
}

export function Pagination({ items, label, onPageChange, ...rest }: PaginationProps) {
  const api = connect({ items, label }, reactNormalizer, { onPageChange })
  return (
    <nav {...rest} {...api.rootProps}>
      <ol {...api.listProps}>
        {items.map((item, index) => {
          const parts = api.getItemProps(item)
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
