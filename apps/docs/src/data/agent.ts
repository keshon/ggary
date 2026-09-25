import type { HistoryTick } from '@ggary/core/history'

/**
 * One run of an agent on this very kit: the thread the chat pages show, the
 * file it changed, and the nightly history the run pages show. The strings
 * live here so every agent page tells the same story.
 */
export const chatThread = {
  ask: 'Add a share bar above the history strip, and let one legend key both.',
  reasoning:
    'The strip answers when, the share answers how much. The legend swatch already falls through to the tone, so it can key both without a second vocabulary.',
  answer: "I'll put the bar above the strip and let the swatch read the tone.",
  followUp: 'Now drop the app rules this replaces.',
  reading: 'Reading the file those rules live in.',
  working: 'Sixty lines go. This rewrites the file in place, so I need permission',
}

/** The failure the run hit on the way, with what it had already tried. */
export const chatFailure = {
  title: 'Could not read static/beacon.css',
  code: 'EBUSY',
  reason: 'The file is locked by another process',
  tried: ['A retry after 1 s — the same code', 'A retry after 4 s — the same code'],
}

/** What permission is being asked for, and what it would touch. A tone here means irreversibility. */
export const chatApproval = {
  what: 'rm -rf build/ && npm run build',
  effects: [
    { text: 'It will delete the build/ directory entire — 1 284 files' },
    { text: 'Irreversible: the contents do not go to a recycle bin', tone: 'error' as const },
    { text: 'The rebuild will take about 40 s' },
  ],
}

/** What the agent read before it changed anything. Cut at 13 of 240 lines. */
export const filtersExcerpt = `export function applyFilters(rows: Lead[], filters: Filter[]) {
  if (filters.length === 0) return rows
  return rows.filter((row) => filters.every((filter) => match(row, filter)))
}

function match(row: Lead, filter: Filter) {
  const value = row[filter.column]
  switch (filter.op) {
    case 'is': return value === filter.value
    case 'contains': return String(value).includes(filter.value)
    case 'before': return new Date(value) < new Date(filter.value)
  }
}`

/** The file as the night left it, and as the agent handed it back. */
export const filtersBefore = `function match(row: Lead, filter: Filter) {
  const value = row[filter.column]
  switch (filter.op) {
    case 'is':
      return value === filter.value
    case 'contains':
      return String(value).includes(filter.value)
    case 'before':
      return new Date(value) < new Date(filter.value)
  }
}
`
export const filtersAfter = `function match(row: Lead, filter: Filter) {
  const value = row[filter.column]
  if (value == null) return false
  switch (filter.op) {
    case 'is':
      return value === filter.value
    case 'contains':
      // an empty needle matched every row, including the ones with no value
      return filter.value !== '' && String(value).includes(filter.value)
    case 'before':
      return new Date(value) < new Date(filter.value)
  }
}
`

/** The output of the shard still running, as far as it has been written. */
export const shardOutput = `PASS  src/grid/filters.test.ts (18 tests)
PASS  src/grid/columns.test.ts (11 tests)
RUNS  src/import/leads.test.ts`

/** The last twenty-four nightly audits of this workflow: one attempt, one mark. */
export const runHistory: HistoryTick[] = [
  ...Array.from({ length: 6 }, () => ({ tone: 'ok' as const, title: 'passed' })),
  { tone: 'error', title: 'failed: 3 probes assert nothing' },
  { tone: 'error', title: 'failed: 3 probes assert nothing' },
  ...Array.from({ length: 4 }, () => ({ tone: 'ok' as const, title: 'passed' })),
  { empty: true, title: 'no run: the runner was down' },
  { empty: true, title: 'no run: the runner was down' },
  ...Array.from({ length: 5 }, () => ({ tone: 'ok' as const, title: 'passed' })),
  { tone: 'warn', title: 'passed with 2 remarks' },
  ...Array.from({ length: 4 }, () => ({ tone: 'ok' as const, title: 'passed' })),
  { tone: 'running', title: 'going now' },
]
