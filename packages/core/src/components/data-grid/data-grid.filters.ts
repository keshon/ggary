import { createFormatter } from './data-grid.format'
import type { ColumnDef, Filter, FilterKind, FilterValue } from './data-grid.types'

/**
 * Filters as a person reads and edits them: which editor a column gets, what a
 * filter says on its chip, and the round trip between a filter and the draft
 * an editor holds while it is being changed.
 */

const NUMERIC = new Set(['number', 'money', 'percent'])
const TEMPORAL = new Set(['date', 'datetime'])

/** The editor a column offers: its own `filter`, or the one its type implies; null for none. */
export function filterKindOf(column: ColumnDef): FilterKind | null {
  if (column.filter === false) return null
  if (column.filter) return column.filter
  if (column.type && NUMERIC.has(column.type)) return 'range'
  if (column.type && TEMPORAL.has(column.type)) return 'date'
  if (column.type === 'enum' || column.type === 'boolean') return 'set'
  return 'text'
}

export const filterableColumns = <Row>(columns: readonly ColumnDef<Row>[]) => columns.filter((column) => filterKindOf(column) !== null)

/** The values a set filter can pick from: the column's options, or yes and no. */
export function setOptions(column: ColumnDef, words: { yes?: string; no?: string; empty?: string } = {}) {
  if (column.options) return column.options
  if (column.type === 'boolean') {
    return [
      { value: true, label: words.yes ?? 'Yes' },
      { value: false, label: words.no ?? 'No' },
    ]
  }
  return []
}

/** A filter that would let everything through: applying it means clearing it. */
export function isFilterEmpty(filter: Filter): boolean {
  switch (filter.kind) {
    case 'text':
      return filter.value.trim() === ''
    case 'set':
      return filter.values.length === 0
    case 'range':
      return filter.min === undefined && filter.max === undefined
    case 'date':
      return !filter.from && !filter.to
  }
}

/** The words of the editor a filter is written in, from a chip or the add button. */
export interface FilterEditorWords {
  /** The locale the date filter reads and writes days in. */
  locale?: string
  apply?: string
  clear?: string
  column?: string
  from?: string
  to?: string
  contains?: string
}

export interface FilterWords {
  locale?: string
  contains?: (text: string) => string
  empty?: string
  from?: (value: string) => string
  to?: (value: string) => string
  between?: (from: string, to: string) => string
  yes?: string
  no?: string
}

/** What a filter says on its chip, without the column's name: "New, Won", "100 – 500", "contains “acme”". */
export function describeFilter(filter: Filter, column: ColumnDef, words: FilterWords = {}): string {
  const {
    locale,
    contains = (text) => `contains “${text}”`,
    empty = 'empty',
    from = (value) => `from ${value}`,
    to = (value) => `up to ${value}`,
    between = (a, b) => `${a} – ${b}`,
  } = words
  switch (filter.kind) {
    case 'text':
      return contains(filter.value.trim())
    case 'set': {
      const options = setOptions(column, words)
      // The column's own word for a value comes first — for no value too:
      // a manager column says "Unassigned", not "empty".
      const label = (value: FilterValue) =>
        options.find((option) => (value === null ? option.value === null : String(option.value) === String(value)))?.label ??
        (value === null ? empty : String(value))
      // Three names read at a glance; more become a count.
      const labels = filter.values.map(label)
      return labels.length <= 3 ? labels.join(', ') : `${labels.slice(0, 2).join(', ')} +${labels.length - 2}`
    }
    case 'range': {
      const format = createFormatter(column, { locale })
      const min = filter.min === undefined ? undefined : format(filter.min)
      const max = filter.max === undefined ? undefined : format(filter.max)
      if (min !== undefined && max !== undefined) return between(min, max)
      return min !== undefined ? from(min) : to(max!)
    }
    case 'date': {
      const format = createFormatter({ ...column, type: 'date' }, { locale })
      const start = filter.from ? format(filter.from) : undefined
      const end = filter.to ? format(filter.to) : undefined
      if (start && end) return between(start, end)
      return start ? from(start) : to(end!)
    }
  }
}

/** What an editor holds while a filter is being changed: every field, as typed. */
export interface FilterDraft {
  kind: FilterKind
  text: string
  values: FilterValue[]
  min: number | null
  max: number | null
  from: string
  to: string
}

export function draftFor(column: ColumnDef, filter?: Filter): FilterDraft {
  const kind = filterKindOf(column) ?? 'text'
  return {
    kind,
    text: filter?.kind === 'text' ? filter.value : '',
    values: filter?.kind === 'set' ? filter.values : [],
    min: filter?.kind === 'range' ? (filter.min ?? null) : null,
    max: filter?.kind === 'range' ? (filter.max ?? null) : null,
    from: filter?.kind === 'date' ? (filter.from ?? '') : '',
    to: filter?.kind === 'date' ? (filter.to ?? '') : '',
  }
}

/**
 * The filter a draft stands for, or null when the draft lets everything
 * through. A range typed backwards is turned round rather than matching nothing.
 */
export function filterFromDraft(column: ColumnDef, draft: FilterDraft): Filter | null {
  let filter: Filter
  switch (draft.kind) {
    case 'text':
      filter = { column: column.id, kind: 'text', value: draft.text.trim() }
      break
    case 'set':
      filter = { column: column.id, kind: 'set', values: draft.values }
      break
    case 'range': {
      let min = draft.min ?? undefined
      let max = draft.max ?? undefined
      if (min !== undefined && max !== undefined && min > max) [min, max] = [max, min]
      filter = { column: column.id, kind: 'range', min, max }
      break
    }
    case 'date': {
      let from = draft.from || undefined
      let to = draft.to || undefined
      if (from && to && from > to) [from, to] = [to, from]
      filter = { column: column.id, kind: 'date', from, to }
      break
    }
  }
  return isFilterEmpty(filter) ? null : filter
}
