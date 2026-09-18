import {
  collectRows,
  createArraySource,
  createFormatter,
  downloadText,
  selectedCount,
  toCsv,
  type CellEdit,
  type ColumnDef,
  type DataGridController,
  type GridView,
  type RowMenuTarget,
} from '@ggary/core/data-grid'
import type { MenuEntry } from '@ggary/core/menu'

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
  { id: 'company', header: 'Company', pinned: 'start', width: 220, editable: true, validate: (value) => (value ? null : 'A lead needs a company') },
  { id: 'contact', header: 'Contact', width: 170, editable: true },
  {
    id: 'email',
    header: 'Email',
    width: 260,
    editable: true,
    validate: (value) => (value && !String(value).includes('@') ? 'An email has an @ in it' : null),
  },
  { id: 'phone', header: 'Phone', width: 160, sortable: false },
  {
    id: 'status',
    header: 'Status',
    type: 'enum',
    width: 130,
    editable: true,
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
    editable: true,
    options: [...MANAGERS.map((name) => ({ value: name, label: name })), { value: null, label: 'Unassigned' }],
  },
  { id: 'users', header: 'Users', type: 'number', width: 100, description: 'People in the account' },
  { id: 'sum', header: 'Paid', type: 'money', currency: 'RUB', width: 140, description: 'Paid in all, in roubles', editable: true },
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
export async function assignLeads(grid: DataGridController<Lead>, manager: string | null): Promise<number> {
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

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * A save as a server would take it: after a delay, and not always. A lost
 * lead refuses a payment, so the grid's rollback can be seen: type a sum on a
 * "Lost" row.
 */
export async function saveLead(edit: CellEdit<Lead>): Promise<void> {
  await wait(400)
  const lead = leads[edit.row.id - 1]
  if (edit.column.id === 'sum' && lead.status === 'lost') throw new Error('a lost lead has nothing to pay')
  ;(lead as unknown as Record<string, unknown>)[edit.column.id] = edit.value
  // The next query sorts and filters the changed list.
  leadSource.invalidate()
  bulkSource.invalidate()
}

const STATUS_LABELS = { new: 'New', working: 'In work', won: 'Won', lost: 'Lost' } as const
export const statusItems = STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] }))

/** A row's context menu. On a row inside a selection of several, the actions name the selection. */
export function leadMenu(target: RowMenuTarget<Lead>): MenuEntry[] {
  const lead = target.row
  const many = target.selection
  const count = many ? (many.mode === 'keys' ? many.keys.length.toLocaleString('en-US') : 'all') : ''
  return [
    { value: 'open', label: 'Open', shortcut: 'Enter', disabled: Boolean(many) },
    {
      type: 'submenu',
      value: 'assign',
      label: many ? `Assign ${count} leads to` : 'Assign to',
      items: [
        ...MANAGERS.map((name) => ({ type: 'radio' as const, value: `assign:${name}`, label: name, checked: !many && lead.manager === name })),
        { type: 'separator' as const },
        { value: 'assign:', label: 'Nobody' },
      ],
    },
    {
      type: 'submenu',
      value: 'status',
      label: 'Status',
      disabled: Boolean(many),
      items: statusItems.map((item) => ({ type: 'radio' as const, value: `status:${item.value}`, label: item.label, checked: lead.status === item.value })),
    },
    { type: 'separator' },
    { value: 'copy', label: 'Copy email', disabled: Boolean(many) },
  ]
}

/** What a menu choice does. Returns the words for a toast, or null. */
export async function runLeadMenu(grid: DataGridController<Lead>, value: string, target: RowMenuTarget<Lead>): Promise<string | null> {
  if (value === 'open') {
    grid.openDetail(target.index)
    return null
  }
  if (value === 'copy') {
    await navigator.clipboard?.writeText(target.row.email).catch(() => {})
    return `Copied ${target.row.email}`
  }
  const [kind, argument] = value.split(':')
  if (kind === 'assign') {
    const manager = argument || null
    if (target.selection) {
      const count = await assignLeads(grid, manager)
      return manager ? `Assigned ${count.toLocaleString('en-US')} leads to ${manager}` : `Unassigned ${count.toLocaleString('en-US')} leads`
    }
    const saved = await grid.saveCell(target.index, 'manager', manager)
    return saved ? null : 'Not saved'
  }
  if (kind === 'status') await grid.saveCell(target.index, 'status', argument)
  return null
}

const byId = new Map(leadColumns.map((column) => [column.id, column]))
const formatters = new Map(leadColumns.map((column) => [column.id, createFormatter(column, { locale: 'en-US' })]))

/** What the detail sheet lists for a lead, as label and text. */
export function leadFacts(lead: Lead): { label: string; text: string }[] {
  return ['contact', 'email', 'phone', 'manager', 'users', 'sum', 'quality', 'registered', 'active', 'source'].map((id) => ({
    label: byId.get(id)!.header,
    text: formatters.get(id)!((lead as unknown as Record<string, unknown>)[id]),
  }))
}

export const HINT_ROWS =
  'Company, contact, email, status, manager and paid are editable: F2, Enter, a double click or just typing opens the editor; Enter saves, Escape undoes, Tab goes on to the next editable cell. The save takes 400 ms and shows at once — type a sum on a Lost lead and the server refuses it, the old sum comes back and the grid says why. Right-click a row (or Shift+F10) for its menu; on a row inside a selection the menu acts on all of it. Enter on a non-editable cell, or Open, shows the lead in a sheet that walks to the next and previous lead and follows the grid.'

/** The managers, as options with where they sit. */
export const managerOptions = MANAGERS.map((name, i) => ({ value: name, label: name, description: ['Moscow', 'Kazan', 'Samara', 'Perm', 'Moscow'][i] }))

let companyIndex: string[] | null = null

/**
 * The registry's companies as a server would search them: after a delay, the
 * first 20 whose name starts with the query, and how many there are in all.
 * The index is only the lower-cased names — built once, in one pass over the
 * 700,000 leads — and the rest of an option is written for the 20 it returns.
 */
export async function searchCompanies(query: string, signal: AbortSignal) {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, 250)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })
  companyIndex ??= leads.map((lead) => lead.company.toLowerCase())
  const needle = query.trim().toLowerCase()
  const found: number[] = []
  let total = 0
  for (let i = 0; i < companyIndex.length; i += 1) {
    if (needle && !companyIndex[i].startsWith(needle)) continue
    total += 1
    if (found.length < 20) found.push(i)
  }
  const items = found.map((i) => ({ value: String(leads[i].id), label: leads[i].company, description: `${leads[i].contact} · lead ${leads[i].id}` }))
  return { items, total }
}

export const tagOptions = ['Enterprise', 'Renewal', 'Partner', 'Trial', 'Education', 'Government', 'Nonprofit', 'Startup', 'Churn risk', 'Upsell'].map(
  (tag) => ({ value: tag.toLowerCase().replace(/\s+/g, '-'), label: tag })
)

export const HINT_COMBOBOX =
  'Type to narrow the list: a label that starts with what you typed comes first, and case, accents and ё do not count. Arrows walk it, Enter chooses, Escape closes it and on a closed field empties it; leaving without choosing puts the field back. The field keeps the focus the whole time. Several values stand as chips: Backspace in an empty field takes the last. Type a tag that does not exist and “Create …” ends the list: Enter makes it and adds its chip. The company search asks a server — 700,000 leads, answered after 250 ms — once the typing pauses, drops an answer that arrives late for an older question, and keeps the last answer shown while it waits.'
