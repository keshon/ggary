import type { IconName } from '@ggary/icons'
import type { Dict, Normalizer } from '../../types'
import { navAnatomy as anatomy } from './nav.anatomy'
import type { NavGroup, NavItem, NavProps, NavWords } from './nav.types'

const idPart = (value: string) => value.replace(/[^\w-]/g, (char) => `_${char.charCodeAt(0).toString(16)}`)

export const navIds = (id: string) => ({
  root: id,
  group: (index: number) => `${id}-group-${index}`,
  item: (href: string) => `${id}-item-${idPart(href)}`,
  subitems: (href: string) => `${id}-sections-${idPart(href)}`,
})

export const NAV_WORDS: NavWords = {
  sections: (label) => `${label}, sections`,
}

/** One of the item's sections is the current page. */
export const hasCurrentSection = (item: NavItem) => (item.items ?? []).some((section) => section.current)

/** Whether an item's sections are shown: as the reader set it, or while the reading is inside it. */
export const isNavItemOpen = (item: NavItem, open: Record<string, boolean> = {}) =>
  open[item.href] ?? (Boolean(item.current) || hasCurrentSection(item))

/**
 * The application's sections in the side column. Every item is a real link, so
 * the middle click, "open in a new tab" and copying the address all work; none
 * of that survives a button.
 *
 * The current item is marked by `aria-current="page"` — the state is in the
 * markup, not in a class — and the theme draws it with a bar at its edge as
 * well as a surface, so the mark does not depend on colour.
 *
 * An item may have sections of its own, one level down. It stands in a branch
 * beside a real button that opens and closes them (`aria-expanded`, and the
 * sections named by the item's link). They are open while the reading is
 * inside the item, unless the reader closed them; the item whose section is
 * current is marked as holding it, and only the section itself is current.
 */
export function connect<T = Dict>(props: NavProps, normalize: Normalizer<T>) {
  const { id, label, groups, open = {}, onOpenChange } = props
  const w = { ...NAV_WORDS, ...props.words }
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

  const getItemProps = (item: NavItem, level: 1 | 2 = 1) => {
    const sections = level === 1 && (item.items?.length ?? 0) > 0
    return {
      itemProps: normalize({
        ...anatomy.attrs('item'),
        id: sections ? ids.item(item.href) : undefined,
        href: item.href,
        'aria-current': item.current ? 'page' : undefined,
        'data-current': item.current ? '' : undefined,
        // Holds the current section: said by the section itself, shown here.
        'data-current-branch': sections && !item.current && hasCurrentSection(item) ? '' : undefined,
        'data-level': level,
      }),
      iconProps: normalize({ ...anatomy.attrs('icon'), 'data-icon': item.icon, 'aria-hidden': 'true' }),
      countProps: normalize({ ...anatomy.attrs('count') }),
      showIcon: Boolean(item.icon),
      showCount: item.count !== undefined && item.count !== null && item.count !== '',
    }
  }

  /** For an item with sections: the branch it stands in, its button, and the sections. Null for any other. */
  const getBranchProps = (item: NavItem) => {
    if (!item.items?.length) return null
    const shown = isNavItemOpen(item, open)
    return {
      open: shown,
      sections: item.items,
      branchProps: normalize({ ...anatomy.attrs('branch'), 'data-state': shown ? 'open' : 'closed' }),
      toggleProps: normalize({
        ...anatomy.attrs('toggle'),
        type: 'button',
        'aria-expanded': shown ? 'true' : 'false',
        'aria-controls': ids.subitems(item.href),
        'aria-label': w.sections(item.label),
        'data-state': shown ? 'open' : 'closed',
        onClick: () => onOpenChange?.(item.href, !shown),
      }),
      toggleIconProps: normalize({
        ...anatomy.attrs('toggle-icon'),
        'aria-hidden': 'true',
        'data-icon': 'chevron-right' satisfies IconName,
        'data-state': shown ? 'open' : 'closed',
      }),
      subitemsProps: normalize({
        ...anatomy.attrs('subitems'),
        id: ids.subitems(item.href),
        role: 'group',
        'aria-labelledby': ids.item(item.href),
        hidden: !shown,
      }),
    }
  }

  return {
    ids,
    groups,
    words: w,
    getGroupProps,
    getItemProps,
    getBranchProps,
    rootProps: normalize({ ...anatomy.attrs('root'), id: ids.root, 'aria-label': label }),
  }
}
