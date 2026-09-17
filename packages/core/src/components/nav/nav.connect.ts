import type { Dict, Normalizer } from '../../types'
import { navAnatomy as anatomy } from './nav.anatomy'
import type { NavGroup, NavItem, NavProps } from './nav.types'

export const navIds = (id: string) => ({
  root: id,
  group: (index: number) => `${id}-group-${index}`,
})

/**
 * The application's sections in the side column. Every item is a real link, so
 * the middle click, "open in a new tab" and copying the address all work; none
 * of that survives a button.
 *
 * The current item is marked by `aria-current="page"` — the state is in the
 * markup, not in a class — and the theme draws it with a bar at its edge as
 * well as a surface, so the mark does not depend on colour.
 */
export function connect<T = Dict>(props: NavProps, normalize: Normalizer<T>) {
  const { id, label, groups } = props
  const ids = navIds(id)

  const getGroupProps = (group: NavGroup, index: number) => ({
    groupProps: normalize({
      ...anatomy.attrs('group'),
      // A named group is a group; an unnamed one is only a gap in the column.
      role: group.label ? 'group' : undefined,
      'aria-labelledby': group.label ? ids.group(index) : undefined,
    }),
    groupLabelProps: normalize({ ...anatomy.attrs('group-label'), id: ids.group(index) }),
    showLabel: Boolean(group.label),
  })

  const getItemProps = (item: NavItem) => ({
    itemProps: normalize({
      ...anatomy.attrs('item'),
      href: item.href,
      'aria-current': item.current ? 'page' : undefined,
      'data-current': item.current ? '' : undefined,
    }),
    iconProps: normalize({ ...anatomy.attrs('icon'), 'data-icon': item.icon, 'aria-hidden': 'true' }),
    countProps: normalize({ ...anatomy.attrs('count') }),
    showIcon: Boolean(item.icon),
    showCount: item.count !== undefined && item.count !== null && item.count !== '',
  })

  return {
    ids,
    groups,
    getGroupProps,
    getItemProps,
    rootProps: normalize({ ...anatomy.attrs('root'), id: ids.root, 'aria-label': label }),
  }
}
