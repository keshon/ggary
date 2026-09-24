import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import {
  connectList,
  connectListItem,
  focusListItem,
  type ListItemProps as CoreListItemProps,
  type ListMoreState,
  type ListProps as CoreListProps,
  type ListWords,
} from '@ggary/core/list'
import { reactNormalizer } from '@ggary/core'
import { useConfigured } from '../config-provider'

export interface ListProps extends CoreListProps {
  /** The rows: ListItems. */
  children?: ReactNode
  /** Under the rows, before "Show more": a Pagination, a link to all of them. */
  footer?: ReactNode
  /**
   * Loads the next rows. A promise keeps "Show more" busy until it settles; a
   * rejection says it failed and offers to try again. Once it is done, the
   * focus goes to the first row that came.
   */
  onLoadMore?: () => unknown
  /** There are more to load. Default: true while there is an `onLoadMore`. */
  hasMore?: boolean
  words?: ListWords
}

/** A list of things, each a row with what it is, what is known about it, and what can be done with it. */
export function List(props: ListProps) {
  props = useConfigured(props, { words: 'list' })
  const { variant, label, count, ariaLabel, children, footer, onLoadMore, hasMore, words } = props
  const id = `gg-list-${useId().replace(/:/g, '')}`
  const [more, setMore] = useState<ListMoreState>('idle')
  const items = useRef<HTMLUListElement>(null)
  const load = useRef(onLoadMore)
  load.current = onLoadMore
  // After a load, the index of the first new row, until it is there to take the focus.
  const focusAt = useRef<number | null>(null)

  const rows = () => items.current?.querySelectorAll(":scope > [data-scope='list'][data-part='item']").length ?? 0

  const loadMore = () => {
    const before = rows()
    setMore('loading')
    Promise.resolve()
      .then(() => load.current?.())
      .then(
        () => {
          focusAt.current = before
          setMore('idle')
        },
        () => setMore('failed')
      )
  }

  useLayoutEffect(() => {
    if (focusAt.current === null || more !== 'idle') return
    const index = focusAt.current
    focusAt.current = null
    // Only when the focus was on "Show more", or fell to the page with it gone: a reader elsewhere is left alone.
    const active = document.activeElement
    const followed = !active || active === document.body || active.closest("[data-scope='list'][data-part='footer']") !== null
    if (followed && rows() > index) focusListItem(items.current, index)
  })

  const api = connectList({ id, variant, label, count, ariaLabel }, reactNormalizer, {
    hasMore: hasMore ?? onLoadMore !== undefined,
    more,
    onLoadMore: loadMore,
    words,
  })

  return (
    <div {...api.rootProps}>
      {api.showHeader && (
        <div {...api.headerProps}>
          {label && <div {...api.titleProps}>{label}</div>}
          {count && <span {...api.countProps}>{count}</span>}
        </div>
      )}
      <ul ref={items} {...api.itemsProps}>
        {children}
      </ul>
      {(footer || api.showMore) && (
        <div {...api.footerProps}>
          {footer}
          {api.showMore && <button {...api.moreProps}>{api.moreText}</button>}
          {api.showMore && <span {...api.moreErrorProps}>{api.failed ? api.moreErrorText : ''}</span>}
        </div>
      )}
    </div>
  )
}

export interface ListItemProps extends CoreListItemProps {
  /** At the start: an Avatar, an icon. */
  leading?: ReactNode
  /** At the end, what is known about it: a Badge, a time. */
  meta?: ReactNode
  /** Its own buttons — a Menu's trigger — which stay targets of their own over a row that is one. */
  actions?: ReactNode
}

/** A row of a List. Given `href` or `onSelect`, the whole row is its title's link or button. */
export function ListItem(props: ListItemProps) {
  const { title, description, href, onSelect, current, disabled, leading, meta, actions } = props
  const id = `gg-list-item-${useId().replace(/:/g, '')}`
  const api = connectListItem({ id, title, description, href, onSelect, current, disabled }, reactNormalizer)

  return (
    <li {...api.itemProps}>
      {leading !== undefined && <div {...api.leadingProps}>{leading}</div>}
      <div {...api.bodyProps}>
        {api.kind === 'link' ? (
          <a {...api.targetProps}>{title}</a>
        ) : api.kind === 'button' ? (
          <button {...api.targetProps}>{title}</button>
        ) : (
          <span {...api.itemTitleProps}>{title}</span>
        )}
        {description && <span {...api.descriptionProps}>{description}</span>}
      </div>
      {meta !== undefined && <div {...api.metaProps}>{meta}</div>}
      {actions !== undefined && <div {...api.actionsProps}>{actions}</div>}
    </li>
  )
}
