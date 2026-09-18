import type { ColumnDef, ColumnState, Filter, FilterValue, GridQuery, SortKey } from './data-grid.types'

/**
 * A query in the address bar, readable by a person:
 *
 *   ?sort=date:desc,name&status=in:new|won&sum=100..500&date=2026-01-01..2026-01-31&q=acme
 *
 * So a view can be bookmarked, sent to a colleague and restored by Back. The
 * column layout is left out on purpose: widths and order are personal and
 * belong in the person's own storage, not in a link they send someone.
 */

const SORT = 'sort'
const SEARCH = 'q'
const RESERVED = new Set([SORT, SEARCH])

const encodeValue = (value: FilterValue) => (value === null ? '~' : String(value))

function filterToParam(filter: Filter): string {
  switch (filter.kind) {
    case 'text':
      return `has:${filter.value}`
    case 'set':
      return `in:${filter.values.map(encodeValue).join('|')}`
    case 'range':
      return `${filter.min ?? ''}..${filter.max ?? ''}`
    case 'date':
      return `date:${filter.from ?? ''}..${filter.to ?? ''}`
  }
}

/** The query as search params. Only non-empty parts are written. */
export function queryToParams(query: GridQuery, params = new URLSearchParams()): URLSearchParams {
  for (const key of [...params.keys()]) {
    if (RESERVED.has(key) || key.startsWith('f.')) params.delete(key)
  }
  if (query.sort.length > 0) {
    params.set(SORT, query.sort.map((key) => (key.direction === 'asc' ? key.column : `${key.column}:desc`)).join(','))
  }
  for (const filter of query.filters) params.set(`f.${filter.column}`, filterToParam(filter))
  if (query.search.trim()) params.set(SEARCH, query.search.trim())
  return params
}

/** A set value back in its column's own type, by the column's options when it has them. */
function decodeValue(text: string, column: ColumnDef): FilterValue {
  if (text === '~') return null
  const option = column.options?.find((candidate) => String(candidate.value) === text)
  if (option) return option.value
  if (column.type === 'boolean') return text === 'true'
  if (column.type === 'number' || column.type === 'money' || column.type === 'percent') {
    const number = Number(text)
    return Number.isFinite(number) ? number : text
  }
  return text
}

const bound = (text: string) => {
  if (text === '') return undefined
  const number = Number(text)
  return Number.isFinite(number) ? number : undefined
}

function paramToFilter(column: ColumnDef, text: string): Filter | null {
  if (text.startsWith('has:')) return { column: column.id, kind: 'text', value: text.slice(4) }
  if (text.startsWith('in:')) {
    const raw = text.slice(3)
    return { column: column.id, kind: 'set', values: raw === '' ? [] : raw.split('|').map((value) => decodeValue(value, column)) }
  }
  if (text.startsWith('date:')) {
    const [from, to] = text.slice(5).split('..')
    return { column: column.id, kind: 'date', from: from || undefined, to: to || undefined }
  }
  if (text.includes('..')) {
    const [min, max] = text.split('..')
    return { column: column.id, kind: 'range', min: bound(min), max: bound(max) }
  }
  return null
}

/**
 * Search params back to a query, against the columns the grid really has: a
 * link from an older version that names a column since removed loses that
 * part, rather than filtering on nothing and showing an empty grid.
 */
export function queryFromParams(params: URLSearchParams, columns: readonly ColumnDef[]): GridQuery {
  const byId = new Map(columns.map((column) => [column.id, column]))
  const sort: SortKey[] = (params.get(SORT) ?? '')
    .split(',')
    .filter(Boolean)
    .map((part) => {
      const [column, direction] = part.split(':')
      return { column, direction: direction === 'desc' ? 'desc' : 'asc' } as SortKey
    })
    .filter((key) => byId.get(key.column)?.sortable !== false && byId.has(key.column))
  const filters: Filter[] = []
  for (const [name, value] of params) {
    if (!name.startsWith('f.')) continue
    const column = byId.get(name.slice(2))
    if (!column) continue
    const filter = paramToFilter(column, value)
    if (filter) filters.push(filter)
  }
  return { sort, filters, search: params.get(SEARCH) ?? '' }
}

/** The personal part of a view — for localStorage, not for a link. */
export interface ColumnLayout {
  id: string
  width: number
  hidden: boolean
  pinned?: 'start' | 'end'
}

export const columnLayout = (columns: readonly ColumnState[]): ColumnLayout[] =>
  columns.map(({ id, width, hidden, pinned }) => ({ id, width, hidden, pinned }))

/**
 * A stored layout applied to today's columns: known columns take their stored
 * width, visibility, pin and order; columns added since keep their defaults at
 * the end; columns that no longer exist are dropped.
 */
export function applyColumnLayout(columns: readonly ColumnState[], layout: readonly ColumnLayout[]): ColumnState[] {
  const byId = new Map(columns.map((column) => [column.id, column]))
  const ordered: ColumnState[] = []
  for (const stored of layout) {
    const column = byId.get(stored.id)
    if (!column) continue
    byId.delete(stored.id)
    ordered.push({
      ...column,
      width: Math.min(column.maxWidth, Math.max(column.minWidth, stored.width)),
      hidden: stored.hidden,
      pinned: stored.pinned,
    })
  }
  const result = [...ordered, ...byId.values()]
  // A stored layout that hides everything would leave nothing to click on.
  return result.some((column) => !column.hidden) ? result : result.map((column, i) => (i === 0 ? { ...column, hidden: false } : column))
}
