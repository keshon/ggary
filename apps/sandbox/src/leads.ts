import {
  collectRows,
  createArraySource,
  downloadText,
  selectedCount,
  toCsv,
  type ColumnDef,
  type DataGridController,
  type GridView,
} from '@ggary/core/data-grid'

/**
 * A leads registry the size of the one that prompted the data grid: 700,000
 * rows, generated the same on every page, answered with a delay so the grid
 * shows what it does while a server thinks.
 */

export interface Lead {
  id: number
  company: string
  contact: string
  email: string
  phone: string
  manager: string | null
  status: 'new' | 'working' | 'won' | 'lost'
  users: number
  sum: number | null
  quality: number
  registered: string
  active: boolean
  source: 'cloud' | 'box'
}

const COMPANIES = ['Acme', 'Borealis', 'Cobalt', 'Delta', 'Ember', 'Fjord', 'Granite', 'Harbor', 'Iris', 'Juniper', 'Kestrel', 'Lumen', 'Meridian', 'Nimbus', 'Orbit', 'Pioneer']
const KINDS = ['Labs', 'Systems', 'Group', 'Studio', 'Works', 'Logistics', 'Holding', 'Retail']
const FIRST = ['Anna', 'Boris', 'Clara', 'Dmitry', 'Elena', 'Fedor', 'Galina', 'Igor', 'Kira', 'Lev', 'Maria', 'Oleg']
const LAST = ['Ivanova', 'Petrov', 'Smirnova', 'Kuznetsov', 'Popova', 'Volkov', 'Sokolova', 'Lebedev']
const MANAGERS = ['Alexey K.', 'Daria M.', 'Nikita S.', 'Polina V.', 'Roman T.']
const STATUSES = ['new', 'working', 'won', 'lost'] as const

/** Deterministic: the same 700k leads on every page and every run. */
function random(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

export function makeLeads(count: number): Lead[] {
  const next = random(20260917)
  const pick = <T>(list: readonly T[]) => list[Math.floor(next() * list.length)]
  const start = Date.UTC(2024, 0, 1)
  const span = Date.UTC(2026, 8, 17) - start
  const leads: Lead[] = new Array(count)
  for (let i = 0; i < count; i += 1) {
    const company = `${pick(COMPANIES)} ${pick(KINDS)} ${1 + Math.floor(next() * 900)}`
    const first = pick(FIRST)
    const last = pick(LAST)
    const users = 1 + Math.floor(next() ** 3 * 400)
    leads[i] = {
      id: i + 1,
      company,
      contact: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i % 97}@${company.split(' ')[0].toLowerCase()}.example`,
      phone: `+7 9${String(Math.floor(next() * 1e9)).padStart(9, '0').replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2-$3-$4')}`,
      manager: next() < 0.15 ? null : pick(MANAGERS),
      status: pick(STATUSES),
      users,
      sum: next() < 0.4 ? null : Math.round(users * (300 + next() * 900)),
      quality: Math.round(next() * 100) / 100,
      registered: new Date(start + Math.floor(next() * span)).toISOString().slice(0, 10),
      active: next() < 0.55,
      source: next() < 0.8 ? 'cloud' : 'box',
    }
  }
  return leads
}

export const statusTone = { new: 'running', working: 'warn', won: 'ok', lost: 'neutral' } as const

export const leadColumns: ColumnDef<Lead>[] = [
  { id: 'company', header: 'Company', pinned: 'start', width: 220 },
  { id: 'contact', header: 'Contact', width: 170 },
  { id: 'email', header: 'Email', width: 260 },
  { id: 'phone', header: 'Phone', width: 160, sortable: false },
  {
    id: 'status',
    header: 'Status',
    type: 'enum',
    width: 130,
    options: [
      { value: 'new', label: 'New' },
      { value: 'working', label: 'In work' },
      { value: 'won', label: 'Won' },
      { value: 'lost', label: 'Lost' },
    ],
  },
  {
    id: 'manager',
    header: 'Manager',
    type: 'enum',
    width: 150,
    options: [...MANAGERS.map((name) => ({ value: name, label: name })), { value: null, label: 'Unassigned' }],
  },
  { id: 'users', header: 'Users', type: 'number', width: 100, description: 'People in the account' },
  { id: 'sum', header: 'Paid', type: 'money', currency: 'RUB', width: 140, description: 'Paid in all, in roubles' },
  { id: 'quality', header: 'Quality', type: 'percent', width: 100, description: 'How likely the lead is to buy' },
  { id: 'registered', header: 'Registered', type: 'date', width: 140 },
  { id: 'active', header: 'Active this week', type: 'boolean', width: 150 },
  {
    id: 'source',
    header: 'Source',
    type: 'enum',
    width: 110,
    options: [
      { value: 'cloud', label: 'Cloud' },
      { value: 'box', label: 'Box' },
    ],
  },
]

export const LEAD_COUNT = 700_000
export const leads = makeLeads(LEAD_COUNT)

/** The registry as a server would answer it: the same query, after a delay. */
export const leadSource = createArraySource(leads, leadColumns, { latency: 120, locale: 'en' })

/** Queries a person picks by name — the registry's "portraits", as views. */
export const leadViews: GridView[] = [
  { id: 'unassigned', label: 'Unassigned', query: { filters: [{ column: 'manager', kind: 'set', values: [null] }] } },
  {
    id: 'won-2026',
    label: 'Won in 2026, biggest first',
    query: {
      filters: [
        { column: 'status', kind: 'set', values: ['won'] },
        { column: 'registered', kind: 'date', from: '2026-01-01' },
      ],
      sort: [{ column: 'sum', direction: 'desc' }],
    },
  },
  {
    id: 'big',
    label: 'Accounts of 100+ people',
    query: { filters: [{ column: 'users', kind: 'range', min: 100 }], sort: [{ column: 'users', direction: 'desc' }] },
  },
  { id: 'box', label: 'Box leads', query: { filters: [{ column: 'source', kind: 'set', values: ['box'] }] } },
]

export const managerItems = MANAGERS.map((name) => ({ value: name, label: name }))

/** The same data with no delay, for actions that read many rows at once. */
const bulkSource = createArraySource(leads, leadColumns, { locale: 'en' })

/** The selection when there is one, otherwise everything the query matches. */
function scope(grid: DataGridController<Lead>) {
  const { grid: state, data } = grid.getSnapshot()
  const selected = (selectedCount(state.selection, data.total) ?? 0) > 0
  return { query: state.query, selection: selected ? state.selection : undefined }
}

/** A bulk action as a server would run it: on the query or the keys, then the grid reloads what it shows. */
export async function assignLeads(grid: DataGridController<Lead>, manager: string): Promise<number> {
  const { query, selection } = scope(grid)
  const targets = await collectRows(bulkSource, query, { selection, rowKey: (lead) => lead.id, blockSize: 100_000 })
  for (const lead of targets) lead.manager = manager
  leadSource.invalidate()
  bulkSource.invalidate()
  grid.data.refresh()
  grid.send({ type: 'CLEAR_SELECTION' })
  return targets.length
}

/** Everything the query matches, or the selection, as a CSV a Russian Excel opens (`;`, UTF-8 with a BOM). */
export async function exportLeads(grid: DataGridController<Lead>, onProgress?: (done: number, total: number) => void): Promise<number> {
  const { query, selection } = scope(grid)
  const rows = await collectRows(bulkSource, query, { selection, rowKey: (lead) => lead.id, blockSize: 50_000, onProgress })
  downloadText(toCsv(rows, leadColumns, { separator: ';' }), 'leads.csv')
  return rows.length
}

/** Waits for the typing to stop before asking. */
export function debounce<A extends unknown[]>(run: (...args: A) => void, ms = 200) {
  let timer: ReturnType<typeof setTimeout> | undefined
  return (...args: A) => {
    clearTimeout(timer)
    timer = setTimeout(() => run(...args), ms)
  }
}
