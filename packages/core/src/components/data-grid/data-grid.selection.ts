import type { GridQuery, RowKey, Selection, SelectionPayload } from './data-grid.types'

/**
 * Selection as data. "All matching" is a mode, not a list: selecting 700k rows
 * is one object, and the action it feeds is one request with the query in it.
 */

export const emptySelection: Selection = { mode: 'keys', keys: new Set() }

export function isSelected(selection: Selection, key: RowKey): boolean {
  return selection.mode === 'keys' ? selection.keys.has(key) : !selection.except.has(key)
}

/** How many rows are selected; for "all matching", only once the total is known. */
export function selectedCount(selection: Selection, total: number | undefined): number | undefined {
  if (selection.mode === 'keys') return selection.keys.size
  return total === undefined ? undefined : Math.max(0, total - selection.except.size)
}

export function isSelectionEmpty(selection: Selection, total: number | undefined): boolean {
  return selectedCount(selection, total) === 0
}

/** Everything matching the query is selected, with no exceptions. */
export function isAllSelected(selection: Selection, total: number | undefined): boolean {
  if (selection.mode === 'matching') return selection.except.size === 0
  return total !== undefined && total > 0 && selection.keys.size >= total
}

/** Select or unselect these keys, leaving the rest as they were. */
export function setKeys(selection: Selection, keys: readonly RowKey[], selected: boolean): Selection {
  if (selection.mode === 'keys') {
    const next = new Set(selection.keys)
    for (const key of keys) {
      if (selected) next.add(key)
      else next.delete(key)
    }
    return { mode: 'keys', keys: next }
  }
  const except = new Set(selection.except)
  for (const key of keys) {
    if (selected) except.delete(key)
    else except.add(key)
  }
  return { mode: 'matching', except }
}

export function toggleKey(selection: Selection, key: RowKey): Selection {
  return setKeys(selection, [key], !isSelected(selection, key))
}

export const selectAllMatching = (): Selection => ({ mode: 'matching', except: new Set() })

/**
 * What a bulk action receives. "All matching" carries the query it was made
 * under, so the server acts on exactly the rows the person saw counted.
 */
export function selectionPayload(selection: Selection, query: GridQuery): SelectionPayload {
  return selection.mode === 'keys'
    ? { mode: 'keys', keys: [...selection.keys] }
    : { mode: 'matching', query, except: [...selection.except] }
}
