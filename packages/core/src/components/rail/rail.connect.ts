import type { Dict, Normalizer } from '../../types'
import { railAnatomy as anatomy } from './rail.anatomy'
import type { RailItem, RailProps } from './rail.types'

/**
 * The application's sections as a narrow column of glyphs — the rail beside a
 * side column, or instead of one. Instrument names each glyph only for a
 * screen reader; here the name stands under the glyph in small type, so a
 * sighted person does not have to learn twelve pictures either.
 *
 * The current item is `aria-current="page"`, drawn with a fill and a mark at
 * its edge. Items marked `end` stand at the bottom.
 */
export function connect<T = Dict>(props: RailProps, normalize: Normalizer<T>) {
  const { id, label, items } = props

  const getItemProps = (item: RailItem) => ({
    itemProps: normalize({
      ...anatomy.attrs('item'),
      href: item.href,
      'aria-current': item.current ? 'page' : undefined,
      'data-current': item.current ? '' : undefined,
    }),
    iconProps: normalize({ ...anatomy.attrs('icon'), 'data-icon': item.icon, 'aria-hidden': 'true' }),
    labelProps: normalize({ ...anatomy.attrs('label') }),
    countProps: normalize({ ...anatomy.attrs('count') }),
    showCount: item.count !== undefined && item.count !== null && item.count !== '',
  })

  return {
    start: items.filter((item) => !item.end),
    end: items.filter((item) => item.end),
    getItemProps,
    rootProps: normalize({ ...anatomy.attrs('root'), id, 'aria-label': label }),
    spacerProps: normalize({ ...anatomy.attrs('spacer'), 'aria-hidden': 'true' }),
  }
}
