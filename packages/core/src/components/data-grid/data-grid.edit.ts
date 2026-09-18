import { setOptions } from './data-grid.filters'
import { isEmpty, toTime } from './data-grid.query'
import type { ColumnDef, ColumnOption, RowKey } from './data-grid.types'

/**
 * A cell edited in place: which editor a column gets, the text the editor
 * starts from, and the way back from what was typed to a value. The editor
 * holds text — a draft — for every type, so a half-typed number is not lost
 * and one rule reads them all.
 */

export type EditorKind = 'text' | 'number' | 'select' | 'date' | 'datetime'

const NUMERIC = new Set(['number', 'money', 'percent'])

export function editorKindOf(column: ColumnDef): EditorKind {
  if (column.type && NUMERIC.has(column.type)) return 'number'
  if (column.type === 'enum' || column.type === 'boolean') return 'select'
  if (column.type === 'date') return 'date'
  if (column.type === 'datetime') return 'datetime'
  return 'text'
}

export function isEditable<Row>(column: ColumnDef<Row> | undefined, row: Row | undefined): boolean {
  if (!column || row === undefined || !column.editable) return false
  return typeof column.editable === 'function' ? column.editable(row) : true
}

/** Typing a character on these starts an edit with that character; a list or a date has no first letter to type. */
export const typesToEdit = (column: ColumnDef) => {
  const kind = editorKindOf(column)
  return kind === 'text' || kind === 'number'
}

/**
 * The choices of a select editor. A column with no option for "no value" gets
 * one, so an edit can empty the cell as well as fill it.
 */
export function editorOptions(column: ColumnDef, words: { empty?: string; yes?: string; no?: string } = {}): ColumnOption[] {
  const options = setOptions(column, words)
  return options.some((option) => option.value === null) ? options : [{ value: null, label: words.empty ?? '—' }, ...options]
}

const pad = (value: number) => String(value).padStart(2, '0')

/** The editor's starting text for a value. */
export function draftOf(column: ColumnDef, value: unknown): string {
  const kind = editorKindOf(column)
  if (kind === 'select') {
    const index = editorOptions(column).findIndex((option) => (isEmpty(value) ? option.value === null : String(option.value) === String(value)))
    return index === -1 ? '' : String(index)
  }
  if (isEmpty(value)) return ''
  if (kind === 'number') {
    const number = Number(value)
    if (!Number.isFinite(number)) return String(value)
    // A percentage is kept as a fraction and typed as a percentage: 0.25 is "25".
    return String(column.type === 'percent' ? Math.round(number * 1e6) / 1e4 : number)
  }
  if (kind === 'date' || kind === 'datetime') {
    // A date-only string is a day, not a moment: keep it as written.
    if (kind === 'date' && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
    const time = toTime(value)
    if (time === null) return ''
    const date = new Date(time)
    const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    return kind === 'date' ? day : `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}`
  }
  return String(value)
}

export interface EditWords {
  /** Said when a number field holds something else. */
  notANumber?: string
  /** Said when a date field holds something else. */
  notADate?: string
}

/** What was typed, as a value — or why it is not one. An empty draft empties the cell. */
export function parseDraft(column: ColumnDef, draft: string, words: EditWords = {}): { value: unknown } | { error: string } {
  const kind = editorKindOf(column)
  if (kind === 'select') {
    const option = editorOptions(column)[Number(draft)]
    return { value: draft === '' || !option ? null : option.value }
  }
  const text = draft.trim()
  if (text === '') return { value: null }
  if (kind === 'number') {
    // Spaces and a decimal comma are how much of the world types numbers:
    // "1 250,5" is 1250.5. With both a comma and a point, the comma groups.
    let clean = text.replace(/[\s\u00a0\u202f']/g, '')
    clean = clean.includes('.') ? clean.replace(/,/g, '') : clean.replace(',', '.')
    const number = Number(clean.replace(/%$/, ''))
    if (!Number.isFinite(number)) return { error: words.notANumber ?? 'Enter a number' }
    return { value: column.type === 'percent' ? number / 100 : number }
  }
  if (kind === 'date') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || toTime(text) === null) return { error: words.notADate ?? 'Enter a date' }
    return { value: text }
  }
  if (kind === 'datetime') {
    const time = toTime(text)
    if (time === null) return { error: words.notADate ?? 'Enter a date' }
    return { value: new Date(time).toISOString() }
  }
  return { value: draft }
}

/** A copy of the row with one value changed. */
export function setCellValue<Row>(column: ColumnDef<Row>, row: Row, value: unknown): Row {
  if (column.setValue) return column.setValue(row, value)
  return { ...(row as object), [column.id]: value } as Row
}

/** Two values the same for an edit: an edit that changes nothing saves nothing. */
export function sameValue(column: ColumnDef, a: unknown, b: unknown): boolean {
  if (isEmpty(a) && isEmpty(b)) return true
  if (column.type === 'date' || column.type === 'datetime') return toTime(a) === toTime(b)
  return a === b || (typeof a !== 'object' && typeof b !== 'object' && String(a) === String(b))
}

/** One cell, across queries: the row's key and the column's id. */
export const cellKey = (key: RowKey, column: string) => JSON.stringify([key, column])

