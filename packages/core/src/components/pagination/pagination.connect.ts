import type { ControlSize } from '../../utils/size'
import type { Dict, Normalizer } from '../../types'
import { paginationAnatomy as anatomy } from './pagination.anatomy'
import type { PageItem, PaginationProps, PaginationRangeOptions } from './pagination.types'

/**
 * The pages to draw for a range too long to draw whole: the first, the last,
 * the current with its neighbours, and an ellipsis for what is left out. A gap
 * is only drawn when it stands for more than one page — an ellipsis hiding a
 * single page costs the same room and takes away a destination.
 */
export function paginationRange(options: PaginationRangeOptions): PageItem[] {
  const { pages, around = 1, previousLabel, nextLabel, href } = options
  const page = Math.min(Math.max(1, options.page), Math.max(1, pages))
  const address = (n: number) => (href ? href(n) : undefined)

  const shown = new Set<number>([1, pages, page])
  for (let step = 1; step <= around; step += 1) {
    if (page - step >= 1) shown.add(page - step)
    if (page + step <= pages) shown.add(page + step)
  }
  const numbers = [...shown].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b)

  const items: PageItem[] = []
  if (previousLabel !== undefined) {
    items.push({ label: previousLabel, page: page - 1, href: page > 1 ? address(page - 1) : undefined, disabled: page <= 1 })
  }
  const page_ = (n: number) => ({ label: String(n), page: n, href: address(n), current: n === page })
  let previous = 0
  for (const number of numbers) {
    const missing = previous ? number - previous - 1 : 0
    // A gap hiding ONE page costs the same room as the page and takes away a
    // destination, so it is only drawn for two or more.
    if (missing === 1) items.push(page_(number - 1))
    else if (missing > 1) items.push({ label: '…', gap: true })
    items.push(page_(number))
    previous = number
  }
  if (nextLabel !== undefined) {
    items.push({ label: nextLabel, page: page + 1, href: page < pages ? address(page + 1) : undefined, disabled: page >= pages })
  }
  return items
}

export interface PaginationConnectOptions {
  /** The control's size, as Input's and Button's. Default `md`. */
  size?: ControlSize
  /** The page behind the link that was pressed; the page decides what to do with it. */
  onPageChange?: (page: number, event: Event) => void
}

/**
 * Going through a long list. Every page is an address, so these are links: the
 * middle click and "open in a new tab" keep working, and the current page is
 * `aria-current="page"` rather than a class.
 *
 * At the edges the link stays in the page and in the tab order with
 * `aria-disabled` — a link has no `disabled`, and removing it would move the
 * focus somewhere else mid-journey. Blocking the press is the page's, so the
 * pointer is taken off and the callback is not called.
 */
export function connect<T = Dict>(props: PaginationProps, normalize: Normalizer<T>, options: PaginationConnectOptions = {}) {
  const { items, label = 'Pages' } = props

  const getItemProps = (item: PageItem) => ({
    itemProps: normalize({ ...anatomy.attrs('item') }),
    linkProps: normalize({
      ...anatomy.attrs(item.gap ? 'gap' : 'link'),
      href: item.disabled ? undefined : item.href,
      'aria-current': item.current ? 'page' : undefined,
      'aria-disabled': item.disabled ? 'true' : undefined,
      'aria-hidden': item.gap ? 'true' : undefined,
      'data-current': item.current ? '' : undefined,
      'data-disabled': item.disabled ? '' : undefined,
      onClick:
        item.gap || !options.onPageChange
          ? undefined
          : (event: Event) => {
              if (item.disabled) {
                event.preventDefault()
                return
              }
              if (item.page !== undefined) options.onPageChange!(item.page, event)
            },
    }),
    element: item.gap ? 'span' : 'a',
  })

  return {
    items,
    getItemProps,
    rootProps: normalize({ ...anatomy.attrs('root'), 'aria-label': label, 'data-size': options.size ?? 'md' }),
    listProps: normalize({ ...anatomy.attrs('list') }),
  }
}
