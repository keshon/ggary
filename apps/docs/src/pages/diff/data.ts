import type { DiffRow } from '@ggary/core/diff'

/** A test the agent added. */
export const addedTest = `import { applyFilters } from './filters'

test('an empty needle matches nothing', () => {
  expect(applyFilters(leads, [{ column: 'name', op: 'contains', value: '' }])).toEqual([])
})
`

/** A helper the change made redundant. */
export const removedHelper = `export function isBlank(value: unknown) {
  return value == null || value === ''
}
`

/** The same helper under a new name, with one line changed on the way. */
export const renamedBefore = `export function match(row: Lead, filter: Filter) {
  const value = row[filter.column]
  return compare(value, filter)
}
`
export const renamedAfter = `export function matchRow(row: Lead, filter: Filter) {
  const value = row[filter.column]
  return compare(value, filter)
}
`

/** A diff as a server sends it: the rows already worked out, a fold included. */
export const patchRows: DiffRow[] = [
  { kind: 'context', text: 'function match(row: Lead, filter: Filter) {', before: 1, after: 1 },
  { kind: 'context', text: '  const value = row[filter.column]', before: 2, after: 2 },
  { kind: 'add', text: '  if (value == null) return false', after: 3 },
  { kind: 'context', text: '  switch (filter.op) {', before: 3, after: 4 },
  { kind: 'fold', count: 3 },
  { kind: 'del', text: '      return String(value).includes(filter.value)', before: 7 },
  { kind: 'add', text: "      return filter.value !== '' && String(value).includes(filter.value)", after: 8 },
  { kind: 'context', text: "    case 'before':", before: 8, after: 9 },
]
