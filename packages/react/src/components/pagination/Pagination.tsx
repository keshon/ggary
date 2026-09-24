import { createElement, type HTMLAttributes } from 'react'
import { connect, type PaginationProps as CorePaginationProps } from '@ggary/core/pagination'
import { reactNormalizer } from '@ggary/core'
import type { ControlSize } from '@ggary/core'
import { useConfigured } from '../config-provider'

export interface PaginationProps extends CorePaginationProps, Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** `sm`, `md` or `lg`, as Input's and Button's. Default `md`. */
  size?: ControlSize
  /** The page behind the link that was pressed. Call preventDefault to keep the page. */
  onPageChange?: (page: number, event: Event) => void
}

export function Pagination(own: PaginationProps) {
  const { items, label, onPageChange, size, ...rest } = useConfigured(own, { size: true })
  const api = connect({ items, label }, reactNormalizer, { onPageChange, size })
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
