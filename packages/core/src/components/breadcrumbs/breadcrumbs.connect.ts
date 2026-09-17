import type { Dict, Normalizer } from '../../types'
import { breadcrumbsAnatomy as anatomy } from './breadcrumbs.anatomy'
import type { BreadcrumbsProps, Crumb } from './breadcrumbs.types'

/**
 * The path from the root to this screen: where am I, and how do I get one level
 * up. Not a list of what else there is — that is Nav.
 *
 * An ordered list inside a named nav, because the order is part of the meaning
 * and a screen reader announces the length of the path from it. The last crumb
 * is the page itself: text with `aria-current="page"`, not a link, because a
 * link to where you already are is a false action.
 */
export function connect<T = Dict>(props: BreadcrumbsProps, normalize: Normalizer<T>) {
  const { items, label = 'Breadcrumbs' } = props

  const getItemProps = (item: Crumb, index: number) => {
    const isLast = index === items.length - 1
    // The last crumb is the page even if the caller left an href on it.
    const current = isLast || !item.href
    return {
      current,
      element: current ? 'span' : 'a',
      itemProps: normalize({ ...anatomy.attrs('item'), 'data-current': current ? '' : undefined }),
      linkProps: normalize({
        ...anatomy.attrs(current ? 'current' : 'link'),
        href: current ? undefined : item.href,
        'aria-current': current ? 'page' : undefined,
      }),
    }
  }

  return {
    items,
    getItemProps,
    rootProps: normalize({ ...anatomy.attrs('root'), 'aria-label': label }),
    listProps: normalize({ ...anatomy.attrs('list') }),
  }
}
