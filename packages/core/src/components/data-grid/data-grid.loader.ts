import { queryKey } from './data-grid.query'
import type { GridQuery, GridSource, RowRange } from './data-grid.types'

/**
 * The rows on screen, loaded in blocks as they come into view.
 *
 * What it takes care of, so no adapter has to:
 * - blocks next to each other are asked for in one request;
 * - a new query aborts every request of the old one, and an answer that
 *   arrives late for an old query is dropped rather than drawn;
 * - requests for blocks the person has scrolled far past are aborted too —
 *   dragging the scrollbar across 700k rows asks for the last position only;
 * - while a new query loads, the old rows stay on screen, marked stale,
 *   instead of the table blinking to a spinner and losing its place;
 * - memory is bounded: blocks far from the view are forgotten first.
 */

export interface GridDataOptions {
  /** Rows per request unit. */
  blockSize?: number
  /** How many blocks are kept before the farthest are forgotten. */
  maxBlocks?: number
}

export interface GridDataState {
  /** How many rows match; undefined until the first answer for a query. */
  total: number | undefined
  loading: boolean
  /** The rows on screen belong to the previous query; the new one is loading. */
  stale: boolean
  error: unknown
  /** Changes on every update, for adapters that compare state by reference. */
  version: number
}

export interface GridData<Row> {
  getState(): GridDataState
  subscribe(listener: (state: GridDataState) => void): () => void
  setQuery(query: GridQuery): void
  /** The rows in view changed: load what is missing. */
  ensureRange(range: RowRange): void
  /** A loaded row, or undefined for one still on its way. */
  rowAt(index: number): Row | undefined
  /** After a failed request: ask again for what is on screen. */
  retry(): void
  /** The data changed on the server: reload what is on screen, keeping it shown meanwhile. */
  refresh(): void
  /** Change a loaded row in place — an optimistic edit, before the server confirms it. */
  replaceRow(index: number, row: Row): void
  /**
   * Change loaded rows wherever they are — the way an edit reaches its row
   * after the rows around it moved. `update` returns the new row, or
   * undefined to leave one as it is.
   */
  updateRows(update: (row: Row) => Row | undefined): void
  /**
   * Abort what is in flight and stay usable: the grid left the page, and may
   * come back — React's StrictMode takes every component away once and puts it
   * back. The next ensureRange asks again for what is missing.
   */
  cancel(): void
  destroy(): void
}

const isAbort = (error: unknown) => error instanceof Error && error.name === 'AbortError'

interface Pending {
  controller: AbortController
  blocks: number[]
}

export function createGridData<Row>(source: GridSource<Row>, initial: GridQuery, options: GridDataOptions = {}): GridData<Row> {
  const blockSize = options.blockSize ?? 100
  const maxBlocks = Math.max(4, options.maxBlocks ?? 60)

  let query = initial
  let key = queryKey(initial)
  let blocks = new Map<number, Row[]>()
  let staleBlocks: Map<number, Row[]> | null = null
  let pending: Pending[] = []
  let lastRange: RowRange | null = null
  let destroyed = false
  let state: GridDataState = { total: undefined, loading: false, stale: false, error: null, version: 0 }
  const listeners = new Set<(state: GridDataState) => void>()

  const set = (patch: Partial<GridDataState>) => {
    state = { ...state, ...patch, version: state.version + 1 }
    for (const listener of listeners) listener(state)
  }

  const isPending = (block: number) => pending.some((request) => request.blocks.includes(block))
  const blocksOf = (range: RowRange) => {
    const first = Math.max(0, Math.floor(range.start / blockSize))
    const last = Math.max(first, Math.floor(Math.max(range.start, range.end - 1) / blockSize))
    const total = state.stale ? undefined : state.total
    const lastBlock = total === undefined ? last : Math.min(last, Math.max(0, Math.ceil(total / blockSize) - 1))
    const list: number[] = []
    for (let block = first; block <= lastBlock; block += 1) list.push(block)
    return list
  }

  /** Forget the blocks farthest from what is on screen, never the ones in view. */
  const evict = () => {
    if (blocks.size <= maxBlocks || !lastRange) return
    const centre = (lastRange.start + lastRange.end) / 2 / blockSize
    const visible = new Set(blocksOf(lastRange))
    const byDistance = [...blocks.keys()].filter((block) => !visible.has(block)).sort((a, b) => Math.abs(b - centre) - Math.abs(a - centre))
    for (const block of byDistance.slice(0, blocks.size - maxBlocks)) blocks.delete(block)
  }

  const request = (run: number[]) => {
    const controller = new AbortController()
    const entry: Pending = { controller, blocks: run }
    pending.push(entry)
    const requestKey = key
    const range = { start: run[0] * blockSize, end: (run[run.length - 1] + 1) * blockSize }
    source.load({ ...query, range }, controller.signal).then(
      (page) => {
        pending = pending.filter((candidate) => candidate !== entry)
        // An answer for a query that is no longer asked is not drawn.
        if (destroyed || requestKey !== key || controller.signal.aborted) return
        run.forEach((block, i) => blocks.set(block, page.rows.slice(i * blockSize, (i + 1) * blockSize)))
        staleBlocks = null
        evict()
        set({ total: page.total, stale: false, error: null, loading: pending.length > 0 })
        // The total may have shown that more of the view is real rows now.
        if (lastRange) ensureRange(lastRange)
      },
      (error) => {
        pending = pending.filter((candidate) => candidate !== entry)
        if (destroyed || isAbort(error) || requestKey !== key) {
          if (!destroyed && requestKey === key) set({ loading: pending.length > 0 })
          return
        }
        set({ error, loading: pending.length > 0 })
      }
    )
  }

  const ensureRange = (range: RowRange) => {
    if (destroyed) return
    lastRange = range
    const wanted = blocksOf(range)

    // Requests for blocks far outside the view are no longer wanted: abort them.
    const keep = new Set<number>()
    for (const block of wanted) for (let near = block - 2; near <= block + 2; near += 1) keep.add(near)
    for (const entry of pending) {
      if (!entry.blocks.some((block) => keep.has(block))) entry.controller.abort()
    }
    pending = pending.filter((entry) => !entry.controller.signal.aborted)

    if (state.error) return
    const missing = wanted.filter((block) => !blocks.has(block) && !isPending(block))
    if (missing.length === 0) {
      if (state.loading !== pending.length > 0) set({ loading: pending.length > 0 })
      return
    }
    // Neighbouring blocks travel together: one request per contiguous run.
    let run: number[] = []
    for (const block of missing) {
      if (run.length > 0 && block !== run[run.length - 1] + 1) {
        request(run)
        run = []
      }
      run.push(block)
    }
    if (run.length > 0) request(run)
    if (!state.loading) set({ loading: true })
  }

  const abortAll = () => {
    for (const entry of pending) entry.controller.abort()
    pending = []
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    setQuery(next) {
      const nextKey = queryKey(next)
      if (nextKey === key) return
      abortAll()
      query = next
      key = nextKey
      // The old rows stay on screen, marked stale, until the first new block lands.
      staleBlocks = blocks.size > 0 ? blocks : staleBlocks
      blocks = new Map()
      set({ stale: staleBlocks !== null, error: null, loading: false })
      if (lastRange) ensureRange(lastRange)
    },
    ensureRange,
    rowAt(index) {
      const block = Math.floor(index / blockSize)
      const from = blocks.get(block) ?? staleBlocks?.get(block)
      return from?.[index - block * blockSize]
    },
    retry() {
      set({ error: null })
      if (lastRange) ensureRange(lastRange)
    },
    refresh() {
      abortAll()
      staleBlocks = blocks.size > 0 ? blocks : staleBlocks
      blocks = new Map()
      // A refresh keeps the query, so the new answers must not look like late ones.
      key = `${queryKey(query)}#${state.version}`
      set({ stale: staleBlocks !== null, error: null, loading: false })
      if (lastRange) ensureRange(lastRange)
    },
    replaceRow(index, row) {
      const block = Math.floor(index / blockSize)
      const rows = blocks.get(block)
      if (!rows || index - block * blockSize >= rows.length) return
      const next = rows.slice()
      next[index - block * blockSize] = row
      blocks.set(block, next)
      set({})
    },
    updateRows(update) {
      let changed = false
      for (const map of [blocks, staleBlocks]) {
        if (!map) continue
        for (const [block, rows] of map) {
          let next: Row[] | null = null
          rows.forEach((row, i) => {
            const replaced = update(row)
            if (replaced === undefined || replaced === row) return
            next ??= rows.slice()
            next[i] = replaced
          })
          if (next) {
            map.set(block, next)
            changed = true
          }
        }
      }
      if (changed) set({})
    },
    cancel() {
      abortAll()
      if (state.loading) set({ loading: false })
    },
    destroy() {
      destroyed = true
      abortAll()
      listeners.clear()
    },
  }
}
