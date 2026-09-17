import type { MenuEntry, MenuItem, MenuPoint, MenuSubmenuItem } from './menu.types'

/** What a renderer walks: entries in order, each item with its index in its level's flat list. */
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

export const isSubmenu = (item: MenuItem | undefined): item is MenuSubmenuItem => item?.type === 'submenu'

/**
 * The items of one level, found by following `path`: level 0 is the menu, and
 * each further level is the submenu of the row `path` names in the level
 * before. Empty when the path does not lead to a submenu.
 */
export function levelItems(entries: readonly MenuEntry[], path: readonly number[], level: number): MenuItem[] {
  let items = flattenMenu(entries)
  for (let k = 0; k < level; k++) {
    const row = items[path[k]]
    if (!isSubmenu(row)) return []
    items = flattenMenu(row.items)
  }
  return items
}

/**
 * The corridor from where the pointer left a submenu's row to the near edge of
 * the submenu: a triangle, widened a few pixels behind the exit point so a
 * pointer that wobbles back first does not fall out of it.
 */
export function gracePolygon(exit: MenuPoint, submenu: { left: number; right: number; top: number; bottom: number }): MenuPoint[] {
  const toRight = submenu.left >= exit.x
  const edge = toRight ? submenu.left : submenu.right
  const back = toRight ? -5 : 5
  return [
    { x: exit.x + back, y: exit.y - 5 },
    { x: edge, y: submenu.top },
    { x: edge, y: submenu.bottom },
    { x: exit.x + back, y: exit.y + 5 },
  ]
}

/** Ray casting. Pure. */
export function pointInPolygon(point: MenuPoint, polygon: readonly MenuPoint[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]
    const b = polygon[j]
    const crosses = a.y > point.y !== b.y > point.y && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    if (crosses) inside = !inside
  }
  return inside
}
