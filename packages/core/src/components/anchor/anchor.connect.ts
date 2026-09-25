import type { IconName } from '@ggary/icons'
import type { Dict, Normalizer } from '../../types'
import { anchorAnatomy as anatomy } from './anchor.anatomy'
import type { AnchorItem, AnchorProps, AnchorState, AnchorWords } from './anchor.types'

export const ANCHOR_WORDS: AnchorWords = {
  trigger: (label, current) => (current ? `${label}: ${current}` : label),
}

export const anchorIds = (id: string) => ({ root: id, panel: `${id}-panel` })

/** Every href the anchor points at, in reading order: sections, then their own. */
export const anchorHrefs = (items: AnchorItem[]): string[] => items.flatMap((item) => [item.href, ...(item.items ?? []).map((section) => section.href)])

/** The item whose href is `href`, at either level. */
export const findAnchorItem = (items: AnchorItem[], href: string | null): AnchorItem | undefined =>
  href === null ? undefined : items.flatMap((item) => [item, ...(item.items ?? [])]).find((item) => item.href === href)

/** The media query under which an anchor with a width in `float` folds; null when it never or always does. */
export const anchorFloatQuery = (float: AnchorProps['float']) => (typeof float === 'number' ? `(max-width: ${float - 0.02}px)` : null)

/**
 * On-page navigation. Every entry is a real link to its section, so the
 * address, the back button and "copy link" all work. The section being read
 * is marked by `aria-current="location"` and drawn with the accent edge on
 * the list's rail.
 *
 * Folded (`float`), the list waits behind a button at the window's corner
 * that names the section being read; the button says whether the list is
 * open, a link followed closes it, and so do Escape and a press outside
 * (utils/anchor's `attachAnchorPanel`).
 */
export function connect<T = Dict>(props: AnchorProps, state: AnchorState, normalize: Normalizer<T>) {
  const { id, label, items, onCurrentChange, onOpenChange } = props
  const w = { ...ANCHOR_WORDS, ...props.words }
  const ids = anchorIds(id)
  const reading = findAnchorItem(items, state.current)
  const shown = !state.floating || state.open

  const getItemProps = (item: AnchorItem, level: 1 | 2 = 1) => {
    const current = item.href === state.current
    return {
      itemProps: normalize({ ...anatomy.attrs('item'), 'data-level': level }),
      linkProps: normalize({
        ...anatomy.attrs('link'),
        href: item.href,
        'aria-current': current ? 'location' : undefined,
        'data-current': current ? '' : undefined,
        'data-level': level,
        onClick: () => {
          onCurrentChange?.(item.href)
          if (state.floating && state.open) onOpenChange?.(false)
        },
      }),
      /** One level down only: a section's own sections are not drawn. */
      sections: level === 1 ? (item.items ?? []) : [],
    }
  }

  return {
    ids,
    items,
    words: w,
    showTrigger: state.floating,
    /** What the corner button shows: the section being read, or the list's name before one is. */
    triggerText: reading?.label ?? label,
    getItemProps,
    rootProps: normalize({
      ...anatomy.attrs('root'),
      id: ids.root,
      'aria-label': label,
      'data-floating': state.floating ? '' : undefined,
      'data-state': state.floating ? (state.open ? 'open' : 'closed') : undefined,
    }),
    triggerProps: normalize({
      ...anatomy.attrs('trigger'),
      type: 'button',
      'aria-label': w.trigger(label, reading?.label ?? null),
      'aria-expanded': state.open ? 'true' : 'false',
      'aria-controls': ids.panel,
      'data-state': state.open ? 'open' : 'closed',
      onClick: () => onOpenChange?.(!state.open),
    }),
    triggerIconProps: normalize({ ...anatomy.attrs('trigger-icon'), 'aria-hidden': 'true', 'data-icon': 'list' satisfies IconName }),
    triggerLabelProps: normalize({ ...anatomy.attrs('trigger-label') }),
    panelProps: normalize({ ...anatomy.attrs('panel'), id: ids.panel, hidden: !shown }),
    listProps: (level: 1 | 2 = 1) => normalize({ ...anatomy.attrs('list'), 'data-level': level }),
  }
}
