import type { NavGroup, NavItem } from '@ggary/core/nav'

/** A side column whose links are this site's own pages, so a press on one goes somewhere real. */

const work: NavItem[] = [
  { label: 'Runs', href: '#/run', current: true },
  { label: 'Queue', href: '#/queue' },
  { label: 'History', href: '#/history' },
]
const setup: NavItem[] = [
  { label: 'Budget', href: '#/budget' },
  { label: 'Settings', href: '#/config-provider' },
]

/** Each item's icon, and the count beside it where there is one. */
const decoration: Record<string, Pick<NavItem, 'icon' | 'count'>> = {
  '#/run': { icon: 'grid', count: 7 },
  '#/queue': { icon: 'list', count: 2 },
  '#/history': { icon: 'clock' },
  '#/budget': { icon: 'chart' },
  '#/config-provider': { icon: 'settings' },
}
const decorate = (items: NavItem[]) => items.map((item) => ({ ...item, ...decoration[item.href] }))

export const groups: NavGroup[] = [
  { label: 'Work', items: work },
  { label: 'Setup', items: setup },
]

export const decoratedGroups: NavGroup[] = [
  { label: 'Work', items: decorate(work) },
  { label: 'Setup', items: decorate(setup) },
]

/** An item with sections, one level down; `current` names the page being read. */
export function withSections(current: string): NavGroup[] {
  const item = (label: string, href: string, items?: NavItem[]): NavItem => ({ label, href, current: href === current, items })
  return [
    {
      label: 'Actions',
      items: [
        item('Button', '#/button'),
        item('Chip', '#/chip'),
        item('Menu', '#/menu', [item('Menubar', '#/menubar'), item('ContextMenu', '#/context-menu'), item('CommandPalette', '#/command-palette')]),
      ],
    },
  ]
}
