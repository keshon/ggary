import { describe, expect, it, vi } from 'vitest'
import {
  MAX_SCROLL_HEIGHT,
  applyColumnLayout,
  applyQuery,
  columnLayout,
  createArraySource,
  createFormatter,
  createGridData,
  emptyQuery,
  gridReducer,
  initialGridState,
  isSelected,
  matchesFilter,
  queryFromParams,
  queryToParams,
  rowWindow,
  scrollTopForRow,
  selectedCount,
  selectionPayload,
  visibleColumns,
  type ColumnDef,
  type GridPage,
  type GridQuery,
  type GridRequest,
  type GridSource,
} from '../packages/core/src/components/data-grid'

/**
 * The data grid's engine with no DOM: what a query means, how selection
 * counts, how blocks load and are thrown away, and which rows a scroll
 * position shows — at the scale of the registry that prompted it, 700k rows.
 */

interface Lead {
  id: number
  name: string
  email: string
  status: string | null
  sum: number | null
  date: string
  active: boolean
}

const columns: ColumnDef<Lead>[] = [
  { id: 'name', header: 'Name' },
  { id: 'email', header: 'Email' },
  {
    id: 'status',
    header: 'Status',
    type: 'enum',
    options: [
      { value: 'new', label: 'New' },
      { value: 'won', label: 'Won' },
      { value: 'lost', label: 'Lost' },
    ],
  },
  { id: 'sum', header: 'Sum', type: 'money', currency: 'USD' },
  { id: 'date', header: 'Registered', type: 'date' },
  { id: 'active', header: 'Active', type: 'boolean' },
]

const leads: Lead[] = [
  { id: 1, name: 'Ёлка и Ко', email: 'elka@example.com', status: 'new', sum: 1200, date: '2026-01-10', active: true },
  { id: 2, name: 'Acme', email: 'sales@acme.test', status: 'won', sum: 90, date: '2026-01-31', active: false },
  { id: 3, name: 'Café Noir', email: 'hi@noir.test', status: null, sum: null, date: '2026-02-01', active: true },
  { id: 4, name: 'acme labs', email: 'labs@acme.test', status: 'lost', sum: 1200, date: '2025-12-31', active: true },
  { id: 5, name: 'Zeta 10', email: 'z10@zeta.test', status: 'new', sum: 300, date: '2026-01-15', active: false },
  { id: 6, name: 'Zeta 9', email: 'z9@zeta.test', status: 'won', sum: 300, date: '2026-01-15', active: true },
]

const ids = (rows: Lead[]) => rows.map((row) => row.id)
// The tests order text in English, whatever the machine running them speaks.
const run = (query: Partial<GridQuery>) => ids(applyQuery(leads, columns, { ...emptyQuery, ...query }, { locale: 'en' }))

/** Lets pending promise callbacks run. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('what a query means', () => {
  it('text filters and search ignore case and accents, and every search word must be found', () => {
    expect(run({ filters: [{ column: 'name', kind: 'text', value: 'ACME' }] })).toEqual([2, 4])
    expect(run({ search: 'елка' })).toEqual([1])
    expect(run({ search: 'cafe' })).toEqual([3])
    // Two words, found in two different columns of one row.
    expect(run({ search: 'acme labs@' })).toEqual([4])
    expect(run({ search: 'acme nowhere' })).toEqual([])
  })

  it('a set filter is OR within it, and null stands for empty', () => {
    expect(run({ filters: [{ column: 'status', kind: 'set', values: ['new', 'won'] }] })).toEqual([1, 2, 5, 6])
    expect(run({ filters: [{ column: 'status', kind: 'set', values: [null] }] })).toEqual([3])
    expect(run({ filters: [{ column: 'active', kind: 'set', values: [false] }] })).toEqual([2, 5])
  })

  it('ranges are inclusive, open at a missing end, and never match an empty value', () => {
    expect(run({ filters: [{ column: 'sum', kind: 'range', min: 300, max: 1200 }] })).toEqual([1, 4, 5, 6])
    expect(run({ filters: [{ column: 'sum', kind: 'range', max: 100 }] })).toEqual([2])
    expect(matchesFilter(null, { column: 'sum', kind: 'range', min: 0 })).toBe(false)
  })

  it('a date-only end means the whole of that day', () => {
    expect(run({ filters: [{ column: 'date', kind: 'date', from: '2026-01-01', to: '2026-01-31' }] })).toEqual([1, 2, 5, 6])
    expect(matchesFilter('2026-01-31T23:59:00Z', { column: 'date', kind: 'date', to: '2026-01-31' })).toBe(true)
  })

  it('filters are joined with AND', () => {
    expect(
      run({
        filters: [
          { column: 'status', kind: 'set', values: ['new', 'won'] },
          { column: 'active', kind: 'set', values: [true] },
        ],
      })
    ).toEqual([1, 6])
  })

  it('orders text by the locale it is given: Cyrillic first in Russian, Latin first in English', () => {
    const names = (locale: string) =>
      ids(applyQuery(leads, columns, { ...emptyQuery, sort: [{ column: 'name', direction: 'asc' }] }, { locale }))[0]
    expect(names('ru')).toBe(1)
    expect(names('en')).toBe(2)
  })

  it('sorts numbers as numbers and text naturally, with empty values last in both directions', () => {
    expect(run({ sort: [{ column: 'sum', direction: 'asc' }] })).toEqual([2, 5, 6, 1, 4, 3])
    expect(run({ sort: [{ column: 'sum', direction: 'desc' }] })).toEqual([1, 4, 5, 6, 2, 3])
    // "Zeta 9" before "Zeta 10": the collator reads numbers in text as numbers.
    const byName = run({ sort: [{ column: 'name', direction: 'asc' }] })
    expect(byName.indexOf(6)).toBe(byName.indexOf(5) - 1)
  })

  it('later sort keys break the ties of earlier ones, and the sort is stable', () => {
    expect(
      run({
        sort: [
          { column: 'sum', direction: 'desc' },
          { column: 'name', direction: 'asc' },
        ],
      })
    ).toEqual([4, 1, 6, 5, 2, 3])
    // Equal sums, no tie-breaker: they keep the order they came in.
    expect(run({ sort: [{ column: 'sum', direction: 'desc' }] }).slice(0, 2)).toEqual([1, 4])
  })

  it('a filter or sort on a column the grid does not have is ignored, not an empty grid', () => {
    expect(run({ filters: [{ column: 'gone', kind: 'text', value: 'x' }], sort: [{ column: 'gone', direction: 'asc' }] })).toEqual([
      1, 2, 3, 4, 5, 6,
    ])
  })
})

describe('selection', () => {
  it('counts keys, and counts "all matching" from the total minus its exceptions', () => {
    let state = initialGridState(columns)
    state = gridReducer(state, { type: 'TOGGLE', key: 1, index: 0 })
    state = gridReducer(state, { type: 'TOGGLE', key: 2, index: 1 })
    expect(selectedCount(state.selection, 700_000)).toBe(2)

    state = gridReducer(state, { type: 'SELECT_ALL_MATCHING' })
    state = gridReducer(state, { type: 'TOGGLE', key: 7, index: 6 })
    expect(isSelected(state.selection, 7)).toBe(false)
    expect(isSelected(state.selection, 8)).toBe(true)
    expect(selectedCount(state.selection, 700_000)).toBe(699_999)
    expect(selectedCount(state.selection, undefined)).toBeUndefined()
  })

  it('hands a bulk action the query itself when everything matching is selected', () => {
    let state = initialGridState(columns, { filters: [{ column: 'status', kind: 'set', values: ['new'] }] })
    state = gridReducer(state, { type: 'SELECT_ALL_MATCHING' })
    state = gridReducer(state, { type: 'TOGGLE', key: 5, index: 1 })
    expect(selectionPayload(state.selection, state.query)).toEqual({ mode: 'matching', query: state.query, except: [5] })
  })

  it('a new query drops the selection: it was made on rows no longer shown', () => {
    let state = initialGridState(columns)
    state = gridReducer(state, { type: 'TOGGLE', key: 1, index: 0 })
    state = gridReducer(state, { type: 'SET_SEARCH', search: 'acme' })
    expect(selectedCount(state.selection, 2)).toBe(0)
    // ...but typing the same query again is not a new query.
    state = gridReducer(state, { type: 'TOGGLE', key: 2, index: 0 })
    state = gridReducer(state, { type: 'SET_SEARCH', search: 'acme ' })
    expect(selectedCount(state.selection, 2)).toBe(1)
  })

  it('a Shift range adds to what was selected', () => {
    let state = initialGridState(columns)
    state = gridReducer(state, { type: 'TOGGLE', key: 1, index: 0 })
    expect(state.anchor).toBe(0)
    state = gridReducer(state, { type: 'SELECT_RANGE', keys: [3, 4, 5], index: 4 })
    expect(selectedCount(state.selection, 6)).toBe(4)
    expect(state.focus).toEqual({ row: 4, column: 0 })
  })
})

describe('sorting and columns', () => {
  it('a header cycles ascending, descending, off; Shift adds a column instead of replacing', () => {
    let state = initialGridState(columns)
    state = gridReducer(state, { type: 'SORT', column: 'sum' })
    expect(state.query.sort).toEqual([{ column: 'sum', direction: 'asc' }])
    state = gridReducer(state, { type: 'SORT', column: 'sum' })
    expect(state.query.sort).toEqual([{ column: 'sum', direction: 'desc' }])
    state = gridReducer(state, { type: 'SORT', column: 'name', additive: true })
    expect(state.query.sort).toEqual([
      { column: 'sum', direction: 'desc' },
      { column: 'name', direction: 'asc' },
    ])
    state = gridReducer(state, { type: 'SORT', column: 'name' })
    expect(state.query.sort).toEqual([{ column: 'name', direction: 'asc' }])
    state = gridReducer(gridReducer(state, { type: 'SORT', column: 'name' }), { type: 'SORT', column: 'name' })
    expect(state.query.sort).toEqual([])
  })

  it('widths stay within their bounds, and the last visible column cannot be hidden', () => {
    let state = initialGridState([
      { id: 'a', header: 'A', minWidth: 80, maxWidth: 300 },
      { id: 'b', header: 'B' },
    ])
    state = gridReducer(state, { type: 'RESIZE', column: 'a', width: 20 })
    expect(state.columns[0].width).toBe(80)
    state = gridReducer(state, { type: 'RESIZE', column: 'a', width: 9999 })
    expect(state.columns[0].width).toBe(300)
    state = gridReducer(state, { type: 'SET_HIDDEN', column: 'a', hidden: true })
    const before = state
    state = gridReducer(state, { type: 'SET_HIDDEN', column: 'b', hidden: true })
    expect(state).toBe(before)
  })

  it('pinned columns come first and last, each group keeping its own order', () => {
    let state = initialGridState(columns)
    state = gridReducer(state, { type: 'PIN', column: 'email', pinned: 'start' })
    state = gridReducer(state, { type: 'PIN', column: 'name', pinned: 'end' })
    state = gridReducer(state, { type: 'MOVE', column: 'date', to: 0 })
    expect(visibleColumns(state.columns).map((column) => column.id)).toEqual(['email', 'date', 'status', 'sum', 'active', 'name'])
  })

  it('a stored layout is laid over today’s columns: new ones join, removed ones drop', () => {
    const today = initialGridState([...columns, { id: 'owner', header: 'Owner' }]).columns
    const stored = [
      { id: 'sum', width: 200, hidden: false },
      { id: 'gone', width: 100, hidden: false },
      { id: 'name', width: 250, hidden: true },
    ]
    const applied = applyColumnLayout(today, stored)
    expect(applied.slice(0, 2).map((column) => [column.id, column.width, column.hidden])).toEqual([
      ['sum', 200, false],
      ['name', 250, true],
    ])
    expect(applied.map((column) => column.id)).toContain('owner')
    expect(applied.map((column) => column.id)).not.toContain('gone')
    expect(columnLayout(applied)[0]).toEqual({ id: 'sum', width: 200, hidden: false, pinned: undefined })
  })
})

describe('a view in the address bar', () => {
  it('round-trips a query, typed values included', () => {
    const query: GridQuery = {
      sort: [
        { column: 'date', direction: 'desc' },
        { column: 'name', direction: 'asc' },
      ],
      filters: [
        { column: 'status', kind: 'set', values: ['new', null] },
        { column: 'sum', kind: 'range', min: 100 },
        { column: 'date', kind: 'date', from: '2026-01-01', to: '2026-01-31' },
        { column: 'email', kind: 'text', value: 'acme' },
        { column: 'active', kind: 'set', values: [true] },
      ],
      search: 'labs',
    }
    const params = queryToParams(query)
    expect(params.get('sort')).toBe('date:desc,name')
    expect(params.get('f.sum')).toBe('100..')
    expect(queryFromParams(new URLSearchParams(params.toString()), columns)).toEqual(query)
  })

  it('drops what names a column that is gone, and leaves the page’s other params alone', () => {
    const params = new URLSearchParams('tab=leads&sort=gone,sum:desc&f.gone=in:x&f.status=in:won')
    expect(queryFromParams(params, columns)).toEqual({
      sort: [{ column: 'sum', direction: 'desc' }],
      filters: [{ column: 'status', kind: 'set', values: ['won'] }],
      search: '',
    })
    expect(queryToParams(emptyQuery, params).toString()).toBe('tab=leads')
  })
})

describe('cell text', () => {
  it('writes each type its own way, and an empty cell as a dash', () => {
    expect(createFormatter(columns[3], { locale: 'en-US' })(1200)).toBe('$1,200.00')
    expect(createFormatter(columns[3], { locale: 'en-US' })(null)).toBe('—')
    expect(createFormatter(columns[2])('won')).toBe('Won')
    expect(createFormatter(columns[5], { yes: 'Да', no: 'Нет' })(false)).toBe('Нет')
    expect(createFormatter({ id: 'p', header: 'P', type: 'percent' }, { locale: 'en-US' })(0.25)).toBe('25%')
    expect(createFormatter(columns[4], { locale: 'en-US' })('2026-01-10T12:00:00')).toBe('Jan 10, 2026')
  })
})

describe('which rows a scroll position shows', () => {
  const base = { viewportHeight: 640, rowHeight: 32 }

  it('below the cap, scroll pixels are row pixels', () => {
    const window = rowWindow({ ...base, scrollTop: 3200, total: 1000, overscan: 0 })
    expect(window).toMatchObject({ start: 100, end: 120, scrollHeight: 32_000, ratio: 1, shift: 0 })
  })

  it('700k rows are over every browser’s height cap, so the range is scaled — and both ends stay reachable', () => {
    const total = 700_000
    const top = rowWindow({ ...base, scrollTop: 0, total, overscan: 0 })
    expect(top.scrollHeight).toBe(MAX_SCROLL_HEIGHT)
    expect(top.ratio).toBeGreaterThan(2)
    expect(top.start).toBe(0)

    const bottom = rowWindow({ ...base, scrollTop: MAX_SCROLL_HEIGHT, total, overscan: 0 })
    expect(bottom.end).toBe(total)
    // The last row sits exactly at the bottom edge of the view.
    const lastTop = (total - 1) * base.rowHeight + bottom.shift
    expect(lastTop + base.rowHeight).toBeCloseTo(MAX_SCROLL_HEIGHT, 3)
  })

  it('the row at the top is drawn at the top, wherever the scaled scroll stands', () => {
    const total = 700_000
    for (const scrollTop of [1, 12_345, 4_000_000, 7_000_000]) {
      const window = rowWindow({ ...base, scrollTop, total, overscan: 0 })
      const topRowY = window.start * base.rowHeight + window.shift
      // The first drawn row covers the top edge of the view.
      expect(topRowY).toBeLessThanOrEqual(scrollTop)
      expect(topRowY + base.rowHeight).toBeGreaterThan(scrollTop)
    }
  })

  it('scrolling to a row lands it in view, in both regimes', () => {
    for (const total of [1000, 700_000]) {
      for (const index of [0, 37, Math.floor(total / 2), total - 1]) {
        const scrollTop = scrollTopForRow(index, { ...base, scrollTop: 0, total }, 'start')
        const window = rowWindow({ ...base, scrollTop, total, overscan: 0 })
        expect(index).toBeGreaterThanOrEqual(window.start)
        expect(index).toBeLessThan(window.end)
      }
    }
  })

  it('"nearest" leaves a row that is already fully visible where it is', () => {
    const input = { ...base, scrollTop: 3200, total: 1000 }
    expect(scrollTopForRow(105, input)).toBe(3200)
    expect(scrollTopForRow(99, input)).toBe(3168)
    expect(scrollTopForRow(120, input)).toBe(3232)
  })
})

describe('loading blocks', () => {
  /** A source that answers when told to, and records what it was asked. */
  function controlled<Row>(rows: Row[]) {
    const calls: { request: GridRequest; signal: AbortSignal; resolve: (page: GridPage<Row>) => void; reject: (e: unknown) => void }[] = []
    const source: GridSource<Row> = {
      load: (request, signal) =>
        new Promise((resolve, reject) => {
          calls.push({ request, signal, resolve, reject })
        }),
    }
    const answer = (i: number, total = rows.length) => {
      const { request, resolve } = calls[i]
      resolve({ rows: rows.slice(request.range.start, request.range.end), total })
    }
    return { source, calls, answer }
  }

  const range = (n: number) => Array.from({ length: n }, (_, i) => ({ id: i }))

  it('asks for neighbouring blocks in one request, and nothing twice', async () => {
    const { source, calls, answer } = controlled(range(1000))
    const data = createGridData(source, emptyQuery, { blockSize: 100 })
    data.ensureRange({ start: 150, end: 380 })
    expect(calls.map((call) => call.request.range)).toEqual([{ start: 100, end: 400 }])
    data.ensureRange({ start: 160, end: 390 })
    expect(calls).toHaveLength(1)
    answer(0)
    await settle()
    expect(data.rowAt(399)).toEqual({ id: 399 })
    expect(data.rowAt(400)).toBeUndefined()
    expect(data.getState()).toMatchObject({ total: 1000, loading: false, stale: false })
  })

  it('a new query aborts the old requests, keeps the old rows on screen as stale, and drops a late answer', async () => {
    const { source, calls, answer } = controlled(range(1000))
    const data = createGridData(source, emptyQuery, { blockSize: 100 })
    data.ensureRange({ start: 0, end: 50 })
    answer(0)
    await settle()

    data.ensureRange({ start: 200, end: 250 })
    data.setQuery({ ...emptyQuery, search: 'x' })
    expect(calls[1].signal.aborted).toBe(true)
    // The previous answer is still drawn, marked stale, rather than a blank grid.
    expect(data.getState().stale).toBe(true)
    // An answer for the old query that arrives anyway is not drawn.
    answer(1)
    await settle()
    expect(data.getState().stale).toBe(true)

    const last = calls.length - 1
    expect(calls[last].request.search).toBe('x')
    answer(last, 400)
    await settle()
    expect(data.getState()).toMatchObject({ stale: false, total: 400 })
  })

  it('dragging the scrollbar far away aborts the requests for rows scrolled past', () => {
    const { source, calls } = controlled(range(700_000))
    const data = createGridData(source, emptyQuery, { blockSize: 100 })
    data.ensureRange({ start: 0, end: 50 })
    data.ensureRange({ start: 350_000, end: 350_050 })
    data.ensureRange({ start: 699_950, end: 700_000 })
    expect(calls[0].signal.aborted).toBe(true)
    expect(calls[1].signal.aborted).toBe(true)
    expect(calls[2].signal.aborted).toBe(false)
  })

  it('keeps memory bounded by forgetting the blocks farthest from view', async () => {
    const { source, calls, answer } = controlled(range(10_000))
    const data = createGridData(source, emptyQuery, { blockSize: 100, maxBlocks: 4 })
    for (const start of [0, 1000, 2000, 3000, 4000]) {
      data.ensureRange({ start, end: start + 50 })
      answer(calls.length - 1)
      await settle()
    }
    // The first block is the farthest from row 4000, so it went first.
    expect(data.rowAt(0)).toBeUndefined()
    expect(data.rowAt(4000)).toEqual({ id: 4000 })
  })

  it('an error is shown and not retried by itself; retry asks again', async () => {
    const { source, calls, answer } = controlled(range(100))
    const data = createGridData(source, emptyQuery, { blockSize: 100 })
    data.ensureRange({ start: 0, end: 20 })
    calls[0].reject(new Error('502'))
    await settle()
    expect(String(data.getState().error)).toContain('502')
    data.ensureRange({ start: 0, end: 20 })
    expect(calls).toHaveLength(1)
    data.retry()
    expect(calls).toHaveLength(2)
    answer(1)
    await settle()
    expect(data.getState().error).toBeNull()
  })

  it('refresh reloads what is on screen, keeping it drawn meanwhile', async () => {
    const { source, calls, answer } = controlled(range(100))
    const data = createGridData(source, emptyQuery, { blockSize: 100 })
    data.ensureRange({ start: 0, end: 20 })
    answer(0)
    await settle()
    data.refresh()
    expect(data.rowAt(3)).toEqual({ id: 3 })
    expect(calls).toHaveLength(2)
    answer(1)
    await settle()
    expect(data.getState().stale).toBe(false)
  })

  it('700k rows in the page: the array source sorts once per query, not once per scroll', async () => {
    const big = Array.from({ length: 700_000 }, (_, i) => ({ id: i, sum: (i * 7919) % 100_003 }))
    const bigColumns: ColumnDef<(typeof big)[number]>[] = [{ id: 'sum', header: 'Sum', type: 'number', value: (row) => row.sum }]
    const read = vi.fn(bigColumns[0].value!)
    bigColumns[0].value = read
    const source = createArraySource(big, bigColumns)
    const query: GridQuery = { ...emptyQuery, sort: [{ column: 'sum', direction: 'desc' }] }

    const started = performance.now()
    const first = await source.load({ ...query, range: { start: 0, end: 100 } }, new AbortController().signal)
    const elapsed = performance.now() - started
    expect(first.total).toBe(700_000)
    expect(first.rows[0].sum).toBe(100_002)
    const readsForOneQuery = read.mock.calls.length
    expect(readsForOneQuery).toBe(700_000)

    const later = await source.load({ ...query, range: { start: 350_000, end: 350_100 } }, new AbortController().signal)
    expect(later.rows).toHaveLength(100)
    expect(read.mock.calls.length).toBe(readsForOneQuery)
    // Generous: this is a guard against an accidental quadratic, not a benchmark.
    expect(elapsed).toBeLessThan(5000)
  })
})
