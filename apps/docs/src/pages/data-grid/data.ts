import {
  collectRows,
  createArraySource,
  createFormatter,
  type CellEdit,
  type ColumnDef,
  type DataGridController,
  type GridSource,
  type GridView,
  type RowMenuTarget,
} from '@ggary/core/data-grid'
import type { MenuEntry } from '@ggary/core/menu'

/**
 * A leads registry: DataGrid's rows. Generated from a fixed seed, so every
 * load draws the same 1,200 leads.
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
const LEAD_COUNT = 1_200
const LOCALE = 'en-GB'

function random(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

function makeLeads(count: number): Lead[] {
  const next = random(20260917)
  const pick = <T>(list: readonly T[]) => list[Math.floor(next() * list.length)]
  const start = Date.UTC(2024, 0, 1)
  const span = Date.UTC(2026, 8, 17) - start
  return Array.from({ length: count }, (_, i) => {
    const company = `${pick(COMPANIES)} ${pick(KINDS)} ${1 + Math.floor(next() * 900)}`
    const first = pick(FIRST)
    const last = pick(LAST)
    const users = 1 + Math.floor(next() ** 3 * 400)
    return {
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
  })
}

export const statusTone = { new: 'running', working: 'warn', won: 'ok', lost: 'neutral' } as const
const STATUS_LABELS = { new: 'New', working: 'In work', won: 'Won', lost: 'Lost' } as const
export const statusItems = STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] }))
export const managerItems = MANAGERS.map((name) => ({ value: name, label: name }))

export const leadColumns: ColumnDef<Lead>[] = [
  { id: 'company', header: 'Company', pinned: 'start', width: 220, editable: true, validate: (value) => (value ? null : 'A lead needs a company') },
  { id: 'contact', header: 'Contact', width: 170, editable: true },
  { id: 'email', header: 'Email', width: 260, editable: true, validate: (value) => (value && !String(value).includes('@') ? 'An email has an @ in it' : null) },
  { id: 'phone', header: 'Phone', width: 160, sortable: false },
  { id: 'status', header: 'Status', type: 'enum', width: 130, editable: true, options: statusItems },
  { id: 'manager', header: 'Manager', type: 'enum', width: 150, editable: true, options: [...managerItems, { value: null, label: 'Unassigned' }] },
  { id: 'users', header: 'Users', type: 'number', width: 100, description: 'People in the account' },
  { id: 'sum', header: 'Paid', type: 'money', currency: 'RUB', width: 140, description: 'Paid in all, in roubles', editable: true },
  { id: 'quality', header: 'Quality', type: 'percent', width: 100, description: 'How likely the lead is to buy' },
  { id: 'registered', header: 'Registered', type: 'date', width: 140 },
  { id: 'active', header: 'Active this week', type: 'boolean', width: 150 },
  { id: 'source', header: 'Source', type: 'enum', width: 110, options: [{ value: 'cloud', label: 'Cloud' }, { value: 'box', label: 'Box' }] },
]

/** The registry, read-only: most specimens show it. */
export const leads = makeLeads(LEAD_COUNT)
export const leadKey = (lead: Lead) => lead.id

/** Queries a person picks by name. */
export const leadViews: GridView[] = [
  { id: 'unassigned', label: 'Unassigned', query: { filters: [{ column: 'manager', kind: 'set', values: [null] }] } },
  {
    id: 'won-2026',
    label: 'Won in 2026, biggest first',
    query: { filters: [{ column: 'status', kind: 'set', values: ['won'] }, { column: 'registered', kind: 'date', from: '2026-01-01' }], sort: [{ column: 'sum', direction: 'desc' }] },
  },
  { id: 'big', label: 'Accounts of 100+ people', query: { filters: [{ column: 'users', kind: 'range', min: 100 }], sort: [{ column: 'users', direction: 'desc' }] } },
]

/** The query the "sorted · filtered" grid opens with: won leads of 50+ people, biggest payment first. */
export const wonQuery = {
  sort: [{ column: 'sum', direction: 'desc' as const }, { column: 'company', direction: 'asc' as const }],
  filters: [{ column: 'status', kind: 'set' as const, values: ['won'] }, { column: 'users', kind: 'range' as const, min: 50 }],
}

/** A server that has not answered yet, and never will. */
export const silentSource: GridSource<Lead> = { load: () => new Promise(() => {}) }

/** A server that is down. */
export const failingSource: GridSource<Lead> = { load: () => Promise.reject(new Error('The server did not answer (503)')) }

/** A server that answered the first query, and is still thinking about the next one: its rows stay on show meanwhile. */
const quick = createArraySource(leads, leadColumns, { locale: LOCALE })
export const slowSource: GridSource<Lead> = { load: (request, signal) => (request.sort.length ? new Promise(() => {}) : quick.load(request, signal)) }

/** A save that never answers, and one refused: a payment on a lead is not taken here. */
export const stagedSave = (edit: CellEdit<Lead>) => (edit.column.id === 'sum' ? Promise.reject(new Error('the payment system is offline')) : new Promise<void>(() => {}))

/**
 * The live specimens' own copy of the registry, answered with a moment's
 * delay: what they change stays changed, and the other specimens do not see it.
 */
const ownLeads = makeLeads(LEAD_COUNT)
export const ownSource = createArraySource(ownLeads, leadColumns, { latency: 120, locale: LOCALE })

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** A save as a server takes it: after a moment, and a lost lead refuses a payment — type a sum on a "Lost" row. */
export async function saveLead(edit: CellEdit<Lead>): Promise<void> {
  await wait(400)
  const lead = ownLeads[edit.row.id - 1]
  if (edit.column.id === 'sum' && lead.status === 'lost') throw new Error('a lost lead has nothing to pay')
  ;(lead as unknown as Record<string, unknown>)[edit.column.id] = edit.value
  ownSource.invalidate()
}

/** The selection's leads — or every lead the query matches — given to a manager, as a server would do it. */
export async function assignLeads(grid: DataGridController<Lead>, manager: string | null) {
  const { grid: state } = grid.getSnapshot()
  const targets = await collectRows(ownSource, state.query, { selection: state.selection, rowKey: leadKey })
  for (const lead of targets) lead.manager = manager
  ownSource.invalidate()
  grid.data.refresh()
  grid.send({ type: 'CLEAR_SELECTION' })
}

/** A row's context menu. On a row inside a selection of several, the actions name the selection. */
export function leadMenu(target: RowMenuTarget<Lead>): MenuEntry[] {
  const many = target.selection
  const count = many ? (many.mode === 'keys' ? many.keys.length.toLocaleString(LOCALE) : 'all') : ''
  return [
    { value: 'open', label: 'Open', shortcut: 'Enter', disabled: Boolean(many) },
    {
      type: 'submenu',
      value: 'assign',
      label: many ? `Assign ${count} leads to` : 'Assign to',
      items: [
        ...MANAGERS.map((name) => ({ type: 'radio' as const, value: `assign:${name}`, label: name, checked: !many && target.row.manager === name })),
        { type: 'separator' as const },
        { value: 'assign:', label: 'Nobody' },
      ],
    },
    {
      type: 'submenu',
      value: 'status',
      label: 'Status',
      disabled: Boolean(many),
      items: statusItems.map((item) => ({ type: 'radio' as const, value: `status:${item.value}`, label: item.label, checked: target.row.status === item.value })),
    },
  ]
}

/** What a menu choice does. */
export async function runLeadMenu(grid: DataGridController<Lead>, value: string, target: RowMenuTarget<Lead>) {
  if (value === 'open') return grid.openDetail(target.index)
  const [kind, argument] = value.split(':')
  if (kind === 'assign') {
    if (target.selection) return assignLeads(grid, argument || null)
    await grid.saveCell(target.index, 'manager', argument || null)
  }
  if (kind === 'status') await grid.saveCell(target.index, 'status', argument)
}

const formatters = new Map(leadColumns.map((column) => [column.id, createFormatter(column, { locale: LOCALE })]))
const headers = new Map(leadColumns.map((column) => [column.id, column.header]))

/** What the detail sheet lists for a lead. */
export const leadFacts = (lead: Lead) =>
  ['contact', 'email', 'phone', 'manager', 'users', 'sum', 'quality', 'registered', 'active', 'source'].map((id) => ({
    label: headers.get(id)!,
    value: formatters.get(id)!((lead as unknown as Record<string, unknown>)[id]),
  }))

/* --- states staged as the page loads ------------------------------------------ */

type Grid = DataGridController<Lead>
const staged = new WeakSet<Grid>()
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

/**
 * Runs `run` once on a grid, when it is on the page and its first rows are
 * in: the way a person would make the state, with nobody having to.
 */
function stage(grid: Grid | undefined, run: (grid: Grid) => void | Promise<void>) {
  if (!grid || staged.has(grid)) return
  staged.add(grid)
  const ready = () => grid.element?.isConnected === true && grid.data.rowAt(3) !== undefined
  const go = async () => {
    await frame()
    if (!grid.element?.isConnected) return
    const { scrollX, scrollY } = window
    await run(grid)
    await frame()
    // An editor takes the focus as it opens; a page opening must not give it away.
    if (grid.element?.parentElement?.contains(document.activeElement)) (document.activeElement as HTMLElement).blur()
    window.scrollTo(scrollX, scrollY)
  }
  if (ready()) return void go()
  const stop = grid.subscribe(() => {
    if (!ready()) return
    stop()
    void go()
  })
}

const columnIndex = (grid: Grid, id: string) => grid.layout().columns.findIndex((column) => column.state.id === id)

/** Three rows ticked, the third not next to the others. */
export const stageSelected = (grid?: Grid) =>
  stage(grid, (grid) => {
    for (const row of [0, 1, 3]) grid.check(row)
  })

/** Everything the query matches: the header's box says it. */
export const stageAllMatching = (grid?: Grid) => stage(grid, (grid) => grid.send({ type: 'SELECT_ALL_MATCHING' }))

/** A new order asked for, and the old rows shown, dimmed, while it comes. */
export const stageStale = (grid?: Grid) => stage(grid, (grid) => grid.send({ type: 'SORT', column: 'company' }))

/** An email typed without its @: the editor stays open and says why. */
export const stageInvalid = (grid?: Grid) =>
  stage(grid, async (grid) => {
    grid.startEdit(1, columnIndex(grid, 'email'), 'boris.petrov')
    await frame()
    grid.commitEdit({ refocus: false })
  })

/** One change still saving, one refused and put back. */
export const stageSaves = (grid?: Grid) =>
  stage(grid, (grid) => {
    void grid.saveCell(0, 'manager', grid.data.rowAt(0)?.manager === 'Daria M.' ? 'Roman T.' : 'Daria M.')
    void grid.saveCell(2, 'sum', 99_000)
  })
