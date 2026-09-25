import type { LogLine } from '@ggary/core/log'

/** The stream of run 4127, oldest first. */
export const runLines: LogLine[] = [
  { id: 'l1', level: 'info', time: '02:14:07', text: 'Queued on eu-west-3' },
  { id: 'l2', level: 'info', time: '02:14:31', text: 'Build succeeded, bundle 7.4 MB' },
  { id: 'l3', level: 'debug', time: '02:14:33', text: 'cache hit: node_modules (412 MB)' },
  { id: 'l4', level: 'info', time: '02:14:52', text: '251 tests in 6 shards' },
  { id: 'l5', level: 'warn', time: '02:15:18', text: 'shard 4 is slower than its neighbours (86 s)' },
  { id: 'l6', level: 'error', time: '02:15:49', text: 'AssertionError: applyFilters returned 40 rows, expected 0' },
  { id: 'l7', level: 'info', time: '02:16:02', text: 'agent-01 opened src/grid/filters.ts' },
  { id: 'l8', level: 'debug', time: '02:16:04', text: 'reading 240 lines' },
  { id: 'l9', level: 'info', time: '02:16:40', text: 'agent-01 wrote src/grid/filters.ts (+3 −1)' },
  { id: 'l10', level: 'info', time: '02:16:41', text: 'shard 4 restarted' },
  { id: 'l11', level: 'debug', time: '02:16:44', text: 'PASS src/grid/filters.test.ts (18 tests)' },
  { id: 'l12', level: 'debug', time: '02:16:47', text: 'PASS src/grid/columns.test.ts (11 tests)' },
]

/** A deploy's record, its moments as machine timestamps. */
export const deployLines: LogLine[] = [
  { id: 'd1', level: 'info', time: Date.UTC(2026, 8, 24, 2, 20, 4), text: 'Deploy 88 started by the nightly audit' },
  { id: 'd2', level: 'info', time: Date.UTC(2026, 8, 24, 2, 20, 41), text: 'Preview is live' },
  { id: 'd3', level: 'warn', time: Date.UTC(2026, 8, 24, 2, 21, 2), text: 'Two checks were skipped by a flag' },
]

/** The next line of a stream that keeps arriving: the run's lines again, each with an id of its own. */
export function nextLine(count: number): LogLine {
  const line = runLines[count % runLines.length]
  return { ...line, id: `live-${count}` }
}
