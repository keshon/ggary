/**
 * One small application — a sales team's leads — that the layout pages frame:
 * its navigation, its address, its list and its numbers. Every link goes to a
 * page of this site, so pressing one in a demo never leaves the docs.
 */
import type { Crumb } from '@ggary/core/breadcrumbs'
import type { NavGroup } from '@ggary/core/nav'
import type { RailItem } from '@ggary/core/rail'

export const navGroups: NavGroup[] = [
  {
    label: 'Work',
    items: [
      { label: 'Leads', href: '#/list', icon: 'list', count: 7, current: true },
      { label: 'Deals', href: '#/kanban', icon: 'grid' },
      { label: 'Reports', href: '#/sparkline', icon: 'chart' },
    ],
  },
  { label: 'Setup', items: [{ label: 'Settings', href: '#/config-provider', icon: 'settings' }] },
]

export const railItems: RailItem[] = [
  { label: 'Leads', href: '#/list', icon: 'list', count: 3, current: true },
  { label: 'Deals', href: '#/kanban', icon: 'grid' },
  { label: 'Reports', href: '#/sparkline', icon: 'chart' },
  { label: 'Settings', href: '#/config-provider', icon: 'settings', end: true },
]

export const crumbs: Crumb[] = [{ label: 'Sales', href: '#/list' }, { label: 'Leads' }]

/** What the leads screen says of itself. */
export const description = 'Everyone the sales team is talking to, from the first call to the last invoice.'

export const leads = ['Acme Labs 214', 'Borealis Group 77', 'Cobalt Works 902', 'Delta Retail 18', 'Ember Studio 450', 'Fjord Logistics 33', 'Granite Holding 610']

/** The week in numbers: what a grid, a row or a column of cards holds. */
export const tiles = [
  { title: 'New leads', value: '1,284' },
  { title: 'Won', value: '96' },
  { title: 'Paid', value: 'RUB 4.2M' },
  { title: 'Unassigned', value: '104,802' },
  { title: 'Calls booked', value: '312' },
  { title: 'Lost', value: '41' },
]

/** Tags on a lead: what a row that wraps holds. */
export const tags = ['Enterprise', 'EU', 'Renewal', 'Q4', 'Inbound', 'Priority', 'Two seats', 'Trial', 'Referral', 'Upsell', 'Annual', 'Partner']

export const gaps = ['none', 'tight', 'default', 'loose'] as const

/** Three cards of three heights: what shows how a row lines its items up. */
export const uneven: { title: string; subtitle?: string; value?: string }[] = [
  { title: 'New leads', subtitle: 'This week', value: '1,284' },
  { title: 'Won', value: '96' },
  { title: 'Unassigned' },
]

/** Build runners, one in each state: what a card or a panel in a tone holds. */
export const runners = [
  { tone: 'neutral', name: 'runner-04', line: 'Offline since Monday' },
  { tone: 'running', name: 'runner-02', line: 'Building #4127' },
  { tone: 'ok', name: 'runner-01', line: 'Idle, last job 2 minutes ago' },
  { tone: 'warn', name: 'runner-03', line: 'Has not reported for 5 minutes' },
  { tone: 'error', name: 'runner-05', line: 'Out of disk space' },
] as const
