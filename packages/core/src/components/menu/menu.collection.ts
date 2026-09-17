import type { MenuEntry, MenuItem } from './menu.types'

/** What a renderer walks: entries in order, each item with its index in the flat list. */
export type MenuNode =
  | { kind: 'item'; key: string; item: MenuItem; index: number }
  | { kind: 'separator'; key: string }
  | { kind: 'group'; key: string; label?: string; items: { item: MenuItem; index: number }[] }

/** The items the keyboard walks, in order: separators and group labels are not stops. */
export function flattenMenu(entries: readonly MenuEntry[]): MenuItem[] {
  const items: MenuItem[] = []
  for (const entry of entries) {
    if (entry.type === 'separator') continue
    if (entry.type === 'group') items.push(...entry.items)
    else items.push(entry)
  }
  return items
}

export function menuNodes(entries: readonly MenuEntry[]): MenuNode[] {
  let index = 0
  return entries.map((entry, position): MenuNode => {
    if (entry.type === 'separator') return { kind: 'separator', key: `separator-${position}` }
    if (entry.type === 'group') {
      return {
        kind: 'group',
        key: `group-${position}`,
        label: entry.label,
        items: entry.items.map((item) => ({ item, index: index++ })),
      }
    }
    return { kind: 'item', key: entry.value, item: entry, index: index++ }
  })
}
