import type { DataGridController } from './data-grid.controller'
import { queryKey } from './data-grid.query'
import type { ColumnDef } from './data-grid.types'
import { applyColumnLayout, columnLayout, queryFromParams, queryToParams, readableSearch, type ColumnLayout } from './data-grid.views'

/**
 * Where a grid's state lives between visits. The query goes in the address
 * bar — a view someone can bookmark, send, and go Back to; the column layout
 * goes in the person's own storage, because widths and order are theirs and do
 * not belong in a link they send someone else.
 */

export interface UrlSyncOptions {
  /** `replace` keeps Back for leaving the page; `push` makes every query a step. */
  history?: 'replace' | 'push'
  /** The window whose address bar is followed; the current one by default. */
  window?: Window
}

/** Follow the address bar: read the query from it now, write it back on every change, and follow Back. */
export function attachQueryToUrl<Row>(controller: DataGridController<Row>, options: UrlSyncOptions = {}): () => void {
  const target = options.window ?? window
  const read = () => queryFromParams(new URLSearchParams(target.location.search), controller.options.columns as ColumnDef[])

  const initial = read()
  if (queryKey(initial) !== queryKey(controller.getSnapshot().grid.query)) controller.send({ type: 'SET_QUERY', query: initial })

  let written = queryKey(controller.getSnapshot().grid.query)
  const stop = controller.subscribe(() => {
    const query = controller.getSnapshot().grid.query
    const key = queryKey(query)
    if (key === written) return
    written = key
    const params = queryToParams(query, new URLSearchParams(target.location.search))
    const search = readableSearch(params)
    const url = `${target.location.pathname}${search ? `?${search}` : ''}${target.location.hash}`
    if (options.history === 'push') target.history.pushState(target.history.state, '', url)
    else target.history.replaceState(target.history.state, '', url)
  })
  const onPop = () => {
    const query = read()
    written = queryKey(query)
    controller.send({ type: 'SET_QUERY', query })
  }
  target.addEventListener('popstate', onPop)
  return () => {
    stop()
    target.removeEventListener('popstate', onPop)
  }
}

/**
 * Remember the column layout under a key. Storage can be missing or refuse —
 * a private window, a full quota — and then the grid simply does not remember.
 */
export function attachColumnStorage<Row>(controller: DataGridController<Row>, key: string, storage?: Storage): () => void {
  let store: Storage | undefined
  try {
    store = storage ?? window.localStorage
  } catch {
    store = undefined
  }
  try {
    const saved = store?.getItem(key)
    if (saved) {
      const layout = JSON.parse(saved) as ColumnLayout[]
      if (Array.isArray(layout)) {
        controller.send({ type: 'SET_COLUMNS', columns: applyColumnLayout(controller.getSnapshot().grid.columns, layout) })
      }
    }
  } catch {
    // A layout that does not parse is forgotten, not fatal.
  }
  let last = controller.getSnapshot().grid.columns
  return controller.subscribe(() => {
    const columns = controller.getSnapshot().grid.columns
    if (columns === last) return
    last = columns
    try {
      store?.setItem(key, JSON.stringify(columnLayout(columns)))
    } catch {
      // Storage refused; the layout lives for this visit only.
    }
  })
}
