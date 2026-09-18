import { isEmpty, toTime } from './data-grid.query'
import type { ColumnDef } from './data-grid.types'

/**
 * How a value is written in a cell, by the column's type. Numbers stand at the
 * end of the cell so their digits line up; everything else at the start.
 */

/** Written for a cell with no value, and read as "empty" — not as a zero. */
export const EMPTY_CELL = '—'

const NUMERIC = new Set(['number', 'money', 'percent'])

export const alignOf = (column: Pick<ColumnDef, 'type'>): 'start' | 'end' =>
  column.type && NUMERIC.has(column.type) ? 'end' : 'start'

const cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>()
const numberFormat = (locale: string | undefined, options: Intl.NumberFormatOptions) => {
  const key = `n|${locale}|${JSON.stringify(options)}`
  if (!cache.has(key)) cache.set(key, new Intl.NumberFormat(locale, options))
  return cache.get(key) as Intl.NumberFormat
}
const dateFormat = (locale: string | undefined, options: Intl.DateTimeFormatOptions) => {
  const key = `d|${locale}|${JSON.stringify(options)}`
  if (!cache.has(key)) cache.set(key, new Intl.DateTimeFormat(locale, options))
  return cache.get(key) as Intl.DateTimeFormat
}

export interface FormatOptions {
  locale?: string
  /** The words for a boolean cell. */
  yes?: string
  no?: string
}

/** A function from a cell's value to its text, built once per column. */
export function createFormatter(column: ColumnDef, options: FormatOptions = {}): (value: unknown) => string {
  const { locale, yes = 'Yes', no = 'No' } = options
  const guard = (write: (value: unknown) => string) => (value: unknown) => (isEmpty(value) ? EMPTY_CELL : write(value))

  switch (column.type) {
    case 'number': {
      const format = numberFormat(locale, { maximumFractionDigits: 2 })
      return guard((value) => (Number.isFinite(Number(value)) ? format.format(Number(value)) : String(value)))
    }
    case 'money': {
      const format = column.currency
        ? numberFormat(locale, { style: 'currency', currency: column.currency, maximumFractionDigits: 2 })
        : numberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      return guard((value) => (Number.isFinite(Number(value)) ? format.format(Number(value)) : String(value)))
    }
    case 'percent': {
      // Values are fractions: 0.25 is 25 %.
      const format = numberFormat(locale, { style: 'percent', maximumFractionDigits: 1 })
      return guard((value) => (Number.isFinite(Number(value)) ? format.format(Number(value)) : String(value)))
    }
    case 'date':
    case 'datetime': {
      const format =
        column.type === 'date'
          ? dateFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' })
          : dateFormat(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      return guard((value) => {
        const time = toTime(value)
        return time === null ? String(value) : format.format(time)
      })
    }
    case 'enum': {
      const labels = new Map((column.options ?? []).map((option) => [String(option.value), option.label]))
      // An option for no value ("Unassigned") names the empty cell too, so the
      // cell says what its filter chip says.
      const none = column.options?.find((option) => option.value === null)?.label
      const write = guard((value) => labels.get(String(value)) ?? String(value))
      return none === undefined ? write : (value) => (value === null || value === undefined ? none : write(value))
    }
    case 'boolean':
      return (value) => (value === null || value === undefined ? EMPTY_CELL : value ? yes : no)
    default:
      return guard((value) => String(value))
  }
}
