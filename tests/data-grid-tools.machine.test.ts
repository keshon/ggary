import { describe, expect, it } from 'vitest'
import {
  attachColumnStorage,
  attachQueryToUrl,
  collectRows,
  connectBulk,
  connectColumns,
  connectFilters,
  createArraySource,
  createDataGrid,
  createFormatter,
  describeFilter,
  draftFor,
  filterFromDraft,
  filterKindOf,
  toCsv,
  type ColumnDef,
} from '../packages/core/src/components/data-grid'

/**
 * The working surface around the grid, with no DOM: what a filter chip says,
 * how an editor's draft becomes a filter, what the bulk bar offers, which
 * columns the picker shows, and export by query rather than by page.
 */

interface Lead {
  id: number
  company: string
  status: string
  sum: number | null
  registered: string
  active: boolean
}

const columns: ColumnDef<Lead>[] = [
  { id: 'company', header: 'Company' },
  {
    id: 'status',
    header: 'Status',
    type: 'enum',
    options: [
      { value: 'new', label: 'New' },
      { value: 'won', label: 'Won' },
      { value: 'lost', label: 'Lost' },
      { value: 'working', label: 'In work' },
    ],
  },
  { id: 'sum', header: 'Paid', type: 'money', currency: 'USD' },
  { id: 'registered', header: 'Registered', type: 'date' },
  { id: 'active', header: 'Active', type: 'boolean' },
  { id: 'id', header: 'Id', type: 'number', filter: false },
]

const leads: Lead[] = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  company: i % 2 ? `Acme ${i}` : `Borealis; "North" ${i}`,
  status: ['new', 'won', 'lost'][i % 3],
  sum: i % 5 === 0 ? null : i * 10,
  registered: `2026-01-${String((i % 28) + 1).padStart(2, '0')}`,
  active: i % 2 === 0,
}))

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

const grid = () => createDataGrid<Lead>({ columns, source: createArraySource(leads, columns), rowKey: (lead) => lead.id, selectable: true })

/** A normalizer that keeps the canonical props, for reading them in a test. */
const same = (props: Record<string, unknown>) => props

describe('filter chips', () => {
  it('each column gets the editor its type implies, and can refuse one', () => {
    expect(columns.map((column) => filterKindOf(column))).toEqual(['text', 'set', 'range', 'date', 'set', null])
  })

  it('a chip says what the filter keeps, in words', () => {
    const say = (filter: Parameters<typeof describeFilter>[0], column: ColumnDef) => describeFilter(filter, column, { locale: 'en-US' })
    expect(say({ column: 'status', kind: 'set', values: ['new', 'won'] }, columns[1])).toBe('New, Won')
    expect(say({ column: 'status', kind: 'set', values: ['new', 'won', 'lost', 'working'] }, columns[1])).toBe('New, Won +2')
    expect(say({ column: 'sum', kind: 'range', min: 100, max: 500 }, columns[2])).toBe('$100.00 – $500.00')
    expect(say({ column: 'sum', kind: 'range', min: 100 }, columns[2])).toBe('from $100.00')
    expect(say({ column: 'registered', kind: 'date', to: '2026-01-31' }, columns[3])).toBe('up to Jan 31, 2026')
    expect(say({ column: 'company', kind: 'text', value: ' acme ' }, columns[0])).toBe('contains “acme”')
    expect(say({ column: 'active', kind: 'set', values: [false] }, columns[4])).toBe('No')
    // A column with a word for "no value" uses it.
    const manager: ColumnDef = { id: 'manager', header: 'Manager', type: 'enum', options: [{ value: 'daria', label: 'Daria' }, { value: null, label: 'Unassigned' }] }
    expect(say({ column: 'manager', kind: 'set', values: [null] }, manager)).toBe('Unassigned')
    // …and so does the empty cell, so the cell and its chip agree.
    expect(createFormatter(manager)(null)).toBe('Unassigned')
    expect(createFormatter(columns[1])(null)).toBe('—')
    expect(say({ column: 'status', kind: 'set', values: [null] }, columns[1])).toBe('empty')
  })

  it('an editor’s draft becomes a filter; an empty one clears it, a backwards range is turned round', () => {
    const range = { ...draftFor(columns[2]), min: 500, max: 100 }
    expect(filterFromDraft(columns[2], range)).toEqual({ column: 'sum', kind: 'range', min: 100, max: 500 })
    expect(filterFromDraft(columns[1], draftFor(columns[1]))).toBeNull()
    expect(filterFromDraft(columns[0], { ...draftFor(columns[0]), text: '   ' })).toBeNull()
    // A draft opened on an existing filter starts from it.
    expect(draftFor(columns[1], { column: 'status', kind: 'set', values: ['won'] }).values).toEqual(['won'])
  })

  it('the bar lists the filters in force, and applying and removing go through the grid', () => {
    const controller = grid()
    let api = connectFilters(controller.getSnapshot(), controller, same, { words: { locale: 'en-US' } })
    expect(api.chips).toEqual([])
    expect(api.columns.map((column) => column.id)).toEqual(['company', 'status', 'sum', 'registered', 'active'])

    api.apply(columns[1], { ...draftFor(columns[1]), values: ['won'] })
    api = connectFilters(controller.getSnapshot(), controller, same, { words: { locale: 'en-US' } })
    expect(api.chips.map((chip) => `${chip.name}: ${chip.value}`)).toEqual(['Status: Won'])
    expect(api.hasFilters).toBe(true)

    // An empty draft on a filtered column clears it.
    api.apply(columns[1], draftFor(columns[1]))
    expect(controller.getSnapshot().grid.query.filters).toEqual([])

    api.apply(columns[0], { ...draftFor(columns[0]), text: 'acme' })
    api = connectFilters(controller.getSnapshot(), controller, same)
    ;(api.chips[0].removeProps.onClick as () => void)()
    expect(controller.getSnapshot().grid.query.filters).toEqual([])
  })

  it('a view replaces the whole query', () => {
    const controller = grid()
    controller.send({ type: 'SET_SEARCH', search: 'acme' })
    connectFilters(controller.getSnapshot(), controller, same).applyView({
      id: 'lost',
      label: 'Lost, biggest first',
      query: { filters: [{ column: 'status', kind: 'set', values: ['lost'] }], sort: [{ column: 'sum', direction: 'desc' }] },
    })
    expect(controller.getSnapshot().grid.query).toEqual({
      search: '',
      filters: [{ column: 'status', kind: 'set', values: ['lost'] }],
      sort: [{ column: 'sum', direction: 'desc' }],
    })
  })
})

describe('the bulk bar', () => {
  it('appears with a selection, and offers everything the query matches', async () => {
    const controller = grid()
    controller.data.ensureRange({ start: 0, end: 50 })
    await settle()
    expect(connectBulk(controller.getSnapshot(), controller, same).visible).toBe(false)

    controller.send({ type: 'TOGGLE', key: 1, index: 0 })
    controller.send({ type: 'TOGGLE', key: 2, index: 1 })
    let api = connectBulk(controller.getSnapshot(), controller, same, { words: { locale: 'en-US' } })
    expect(api.visible).toBe(true)
    expect(api.countText).toBe('2 selected')
    expect(api.selectAllText).toBe('Select all 1,000')
    expect(api.payload()).toEqual({ mode: 'keys', keys: [1, 2] })

    ;(api.selectAllProps.onClick as () => void)()
    api = connectBulk(controller.getSnapshot(), controller, same, { words: { locale: 'en-US' } })
    expect(api.countText).toBe('All 1,000 selected')
    expect(api.offer).toBe(false)
    expect(api.payload()).toMatchObject({ mode: 'matching', except: [] })

    ;(api.clearProps.onClick as () => void)()
    expect(connectBulk(controller.getSnapshot(), controller, same).visible).toBe(false)
  })
})

describe('the column picker', () => {
  it('shows the columns as a checkbox group, keeps the last one, and resets', () => {
    const controller = createDataGrid<Lead>({ columns: columns.slice(0, 2), source: createArraySource(leads, columns), rowKey: (lead) => lead.id })
    let api = connectColumns(controller.getSnapshot(), controller, same)
    expect(api.value).toEqual(['company', 'status'])
    api.setVisible(['status'])
    api = connectColumns(controller.getSnapshot(), controller, same)
    expect(api.value).toEqual(['status'])
    expect(api.items.find((item) => item.value === 'status')!.disabled).toBe(true)
    api.reset()
    expect(connectColumns(controller.getSnapshot(), controller, same).value).toEqual(['company', 'status'])
  })
})

describe('export by query, not by page', () => {
  it('reads every matching row, in blocks, with progress', async () => {
    const source = createArraySource(leads, columns)
    const progress: number[] = []
    const rows = await collectRows(source, { sort: [], filters: [{ column: 'status', kind: 'set', values: ['won'] }], search: '' }, {
      blockSize: 100,
      onProgress: (done) => progress.push(done),
    })
    expect(rows).toHaveLength(333)
    expect(progress.at(-1)).toBe(333)
    expect(progress.length).toBeGreaterThan(3)
  })

  it('reads only the selection when there is one — "all matching, except" included', async () => {
    const source = createArraySource(leads, columns)
    const query = { sort: [], filters: [], search: '' }
    const picked = await collectRows(source, query, { selection: { mode: 'keys', keys: new Set([3, 7]) }, rowKey: (lead) => lead.id })
    expect(picked.map((lead) => lead.id)).toEqual([3, 7])
    const except = await collectRows(source, query, { selection: { mode: 'matching', except: new Set([1]) }, rowKey: (lead) => lead.id })
    expect(except).toHaveLength(999)
  })

  it('writes CSV a spreadsheet opens: quoted where needed, raw numbers, a BOM for UTF-8', () => {
    const csv = toCsv(leads.slice(0, 2), columns.slice(0, 3), { separator: ';' })
    expect(csv.startsWith('﻿')).toBe(true)
    const lines = csv.slice(1).split('\r\n')
    expect(lines[0]).toBe('Company;Status;Paid')
    // A separator or a quote inside a value is quoted, the quote doubled.
    expect(lines[1]).toBe('"Borealis; ""North"" 0";new;')
    expect(lines[2]).toBe('Acme 1;won;10')
    expect(toCsv(leads.slice(1, 2), columns.slice(2, 3), { formatted: true, locale: 'en-US', bom: false })).toBe('Paid\r\n$10.00\r\n')
  })
})

describe('where the state lives between visits', () => {
  function fakeWindow(search: string) {
    const listeners: Record<string, (() => void)[]> = {}
    const win = {
      location: { search, pathname: '/leads', hash: '' },
      history: {
        state: null,
        replaceState: (_: unknown, __: string, url: string) => {
          win.location.search = url.includes('?') ? url.slice(url.indexOf('?')) : ''
        },
        pushState: () => {},
      },
      addEventListener: (type: string, listener: () => void) => (listeners[type] ??= []).push(listener),
      removeEventListener: () => {},
      dispatch: (type: string) => listeners[type]?.forEach((listener) => listener()),
    }
    return win
  }

  it('the query follows the address bar both ways, and Back', () => {
    const win = fakeWindow('?tab=sales&f.status=in:won')
    const controller = grid()
    attachQueryToUrl(controller, { window: win as unknown as Window })
    expect(controller.getSnapshot().grid.query.filters).toEqual([{ column: 'status', kind: 'set', values: ['won'] }])

    controller.send({ type: 'SORT', column: 'sum' })
    expect(new URLSearchParams(win.location.search).get('sort')).toBe('sum')
    controller.send({ type: 'SET_FILTER', filter: { column: 'status', kind: 'set', values: ['won', null] } })
    // Readable in the address bar: no %3A, %7C or %7E.
    expect(win.location.search).toContain('f.status=in:won|~')
    // The page's own parameters stay.
    expect(new URLSearchParams(win.location.search).get('tab')).toBe('sales')

    win.location.search = '?q=acme'
    win.dispatch('popstate')
    expect(controller.getSnapshot().grid.query).toEqual({ sort: [], filters: [], search: 'acme' })
  })

  it('the column layout is remembered, and a storage that refuses is not fatal', () => {
    const memory = new Map<string, string>()
    const storage = { getItem: (k: string) => memory.get(k) ?? null, setItem: (k: string, v: string) => memory.set(k, v) } as unknown as Storage
    const first = grid()
    attachColumnStorage(first, 'leads', storage)
    first.send({ type: 'RESIZE', column: 'company', width: 321 })
    first.send({ type: 'SET_HIDDEN', column: 'active', hidden: true })

    const second = grid()
    attachColumnStorage(second, 'leads', storage)
    const company = second.getSnapshot().grid.columns.find((column) => column.id === 'company')!
    expect(company.width).toBe(321)
    expect(second.getSnapshot().grid.columns.find((column) => column.id === 'active')!.hidden).toBe(true)

    const refusing = { getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('denied') } } as unknown as Storage
    const third = grid()
    expect(() => attachColumnStorage(third, 'leads', refusing)).not.toThrow()
    expect(() => third.send({ type: 'RESIZE', column: 'company', width: 200 })).not.toThrow()
  })
})
