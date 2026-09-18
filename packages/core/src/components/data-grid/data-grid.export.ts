import { createFormatter } from './data-grid.format'
import { cellValue } from './data-grid.query'
import { isSelected } from './data-grid.selection'
import type { ColumnDef, GridQuery, GridSource, RowKey, Selection } from './data-grid.types'

/**
 * Export by query, not by page: every row the query matches, or every row the
 * selection holds — the registry this grid was built for exported the 100 rows
 * on screen and called it the filter.
 *
 * A server that can export the query itself should: this walks the source in
 * large blocks, which is right for rows in the page and for a modest server
 * result, and slow for 700,000 rows behind a network.
 */

export interface CollectOptions<Row> {
  /** Rows per request. Large: an export wants throughput, not a screenful. */
  blockSize?: number
  signal?: AbortSignal
  /** Called after every block with the rows read and the total. */
  onProgress?: (done: number, total: number) => void
  /** Only these rows: a selection, read with the keys the grid uses. */
  selection?: Selection
  rowKey?: (row: Row) => RowKey
}

export async function collectRows<Row>(source: GridSource<Row>, query: GridQuery, options: CollectOptions<Row> = {}): Promise<Row[]> {
  const { blockSize = 5000, onProgress, selection, rowKey } = options
  const signal = options.signal ?? new AbortController().signal
  const rows: Row[] = []
  let total = Infinity
  for (let start = 0; start < total; start += blockSize) {
    if (signal.aborted) throw Object.assign(new Error('The export was aborted.'), { name: 'AbortError' })
    const page = await source.load({ ...query, range: { start, end: start + blockSize } }, signal)
    total = page.total
    for (const row of page.rows) {
      if (!selection || !rowKey || isSelected(selection, rowKey(row))) rows.push(row)
    }
    onProgress?.(Math.min(start + blockSize, total), total)
    if (page.rows.length === 0) break
  }
  return rows
}

export interface CsvOptions {
  /** `;` for a spreadsheet in a locale that writes decimals with a comma (Russian Excel), `,` otherwise. */
  separator?: string
  /** Write values as the grid shows them ("$1,200.00") rather than raw (1200). Raw by default: a spreadsheet wants numbers. */
  formatted?: boolean
  locale?: string
  /** A byte order mark, so Excel reads UTF-8 — Cyrillic included — without asking. */
  bom?: boolean
}

const quote = (text: string, separator: string) =>
  /["\r\n]/.test(text) || text.includes(separator) || /^\s|\s$/.test(text) ? `"${text.replace(/"/g, '""')}"` : text

/** A spreadsheet takes an ISO date, `true`/`false`, and a plain number; anything else as text. */
function raw(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

export function toCsv<Row>(rows: readonly Row[], columns: readonly ColumnDef<Row>[], options: CsvOptions = {}): string {
  const { separator = ',', formatted = false, locale, bom = true } = options
  const writers = columns.map((column) => {
    const format = createFormatter(column, { locale })
    return (row: Row) => {
      const value = cellValue(column, row)
      if (!formatted) return raw(value)
      return value === null || value === undefined || value === '' ? '' : format(value)
    }
  })
  const lines = [columns.map((column) => quote(column.header, separator)).join(separator)]
  for (const row of rows) lines.push(writers.map((write) => quote(write(row), separator)).join(separator))
  return (bom ? '﻿' : '') + lines.join('\r\n') + '\r\n'
}

/** Hands the text to the browser as a file to save. */
export function downloadText(text: string, filename: string, type = 'text/csv;charset=utf-8'): void {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
