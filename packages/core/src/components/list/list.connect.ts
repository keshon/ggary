import type { Dict, Normalizer } from '../../types'
import { listAnatomy as anatomy } from './list.anatomy'
import type { ListItemProps, ListMoreState, ListProps, ListWords } from './list.types'

export interface ListConnectOptions {
  /** More can be loaded: the footer offers it. */
  hasMore?: boolean
  /** Where "Show more" stands. */
  more?: ListMoreState
  onLoadMore?: () => void
  words?: ListWords
}

export const listIds = (id: string) => ({
  title: `${id}-title`,
  moreError: `${id}-more-error`,
})

/**
 * The list is a `ul` with the list role said out loud — Safari drops a list's
 * role once its bullets are gone — named by its heading. "Show more" stays
 * focusable while it loads (`aria-disabled`, not `disabled`), so the focus is
 * not dropped to the page under a keyboard user's feet; a failure is said
 * where the button is, and the button offers to try again.
 */
export function connectList<T = Dict>(props: ListProps & { id: string }, normalize: Normalizer<T>, options: ListConnectOptions = {}) {
  const { variant = 'divided', label, count, ariaLabel } = props
  const { hasMore = false, more = 'idle', onLoadMore, words = {} } = options
  const ids = listIds(props.id)
  const loading = more === 'loading'
  const failed = more === 'failed'

  return {
    ids,
    variant,
    showHeader: Boolean(label || count),
    showMore: hasMore && Boolean(onLoadMore),
    moreText: loading ? (words.loading ?? 'Loading…') : failed ? (words.retry ?? 'Try again') : (words.more ?? 'Show more'),
    moreErrorText: words.failed ?? "Couldn't load more",
    failed,
    rootProps: normalize({ ...anatomy.attrs('root'), id: props.id, 'data-variant': variant }),
    headerProps: normalize({ ...anatomy.attrs('header'), 'data-variant': variant }),
    titleProps: normalize({ ...anatomy.attrs('title'), id: ids.title }),
    countProps: normalize({ ...anatomy.attrs('count') }),
    itemsProps: normalize({
      ...anatomy.attrs('items'),
      role: 'list',
      'aria-labelledby': label ? ids.title : undefined,
      'aria-label': label ? undefined : ariaLabel,
      'data-variant': variant,
    }),
    footerProps: normalize({ ...anatomy.attrs('footer'), 'data-variant': variant }),
    moreProps: normalize({
      ...anatomy.attrs('more'),
      type: 'button',
      'aria-disabled': loading ? 'true' : undefined,
      'aria-describedby': failed ? ids.moreError : undefined,
      'data-state': more,
      onClick: () => {
        if (!loading) onLoadMore?.()
      },
    }),
    moreErrorProps: normalize({ ...anatomy.attrs('more-error'), id: ids.moreError, role: 'status' }),
  }
}

/**
 * A row. Given `href` it is a link, given `onSelect` a button; either way the
 * title is the target and is stretched over the row, and the line under the
 * title describes it. A disabled link has no `href` left, so it goes nowhere
 * and says so. The row itself can take the focus from script (`tabIndex=-1`),
 * which is where "Show more" puts it when a plain row is the first new one.
 */
export function connectListItem<T = Dict>(props: ListItemProps & { id: string }, normalize: Normalizer<T>) {
  const { title, description, href, onSelect, current, disabled } = props
  const kind = href !== undefined ? ('link' as const) : onSelect ? ('button' as const) : null
  const describedBy = description ? `${props.id}-description` : undefined
  const state = {
    'data-current': current ? '' : undefined,
    'data-disabled': disabled ? '' : undefined,
  }

  return {
    title,
    description,
    /** What the title is: a link, a button, or plain text. */
    kind,
    itemProps: normalize({ ...anatomy.attrs('item'), id: props.id, tabIndex: -1, 'data-interactive': kind ? '' : undefined, ...state }),
    leadingProps: normalize({ ...anatomy.attrs('leading') }),
    bodyProps: normalize({ ...anatomy.attrs('body') }),
    targetProps: normalize(
      kind === 'link'
        ? {
            ...anatomy.attrs('target'),
            href: disabled ? undefined : href,
            role: disabled ? 'link' : undefined,
            'aria-disabled': disabled ? 'true' : undefined,
            'aria-current': current ? (current === 'page' ? 'page' : 'true') : undefined,
            'aria-describedby': describedBy,
            ...state,
          }
        : {
            ...anatomy.attrs('target'),
            type: 'button',
            disabled: disabled || undefined,
            'aria-current': current ? (current === 'page' ? 'page' : 'true') : undefined,
            'aria-describedby': describedBy,
            onClick: () => onSelect?.(),
            ...state,
          }
    ),
    itemTitleProps: normalize({ ...anatomy.attrs('item-title'), ...state }),
    descriptionProps: normalize({ ...anatomy.attrs('description'), id: describedBy }),
    metaProps: normalize({ ...anatomy.attrs('meta') }),
    actionsProps: normalize({ ...anatomy.attrs('actions') }),
  }
}

/**
 * Puts the focus on the row at `index` of a list — on its link or button when
 * it has one, on the row itself when not: after "Show more", on the first row
 * that came, so the keyboard carries on where the new rows begin.
 */
export function focusListItem(items: Element | null, index: number): boolean {
  const item = items?.querySelectorAll<HTMLElement>(":scope > [data-scope='list'][data-part='item']")[index]
  if (!item) return false
  const target = item.querySelector<HTMLElement>("[data-scope='list'][data-part='target']")
  ;(target && !target.hasAttribute('disabled') ? target : item).focus()
  return true
}
