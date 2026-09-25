import type { RunUnit } from '@ggary/core/run'

/** The phases of one audit run. The unit is an agent, and there are few. */
export const runPhases: { label: string; value: string; units: RunUnit[] }[] = [
  {
    label: 'Analysis',
    value: 'analysis',
    units: [
      { tone: 'ok', title: 'analysis:docs-drift' },
      { tone: 'ok', title: 'analysis:shared-and-chunk' },
      { tone: 'warn', title: 'analysis:probes-assert' },
      { tone: 'ok', title: 'analysis:silent-failure' },
      { tone: 'running', title: 'analysis:coverage-hole' },
      { title: 'analysis:history' },
      { title: 'analysis:eyes-only' },
    ],
  },
  { label: 'Refutation', value: 'refutation', units: [{}, {}, {}] },
  { label: 'Report', value: 'report', units: [{ tone: 'error', title: 'report:link-check' }, {}] },
]

/** Every outcome a unit can have, and one that has not begun. */
export const everyTone: RunUnit[] = [
  { tone: 'ok', title: 'shard 1' },
  { tone: 'ok', title: 'shard 2' },
  { tone: 'warn', title: 'shard 3: passed with a remark' },
  { tone: 'error', title: 'shard 4: 3 failing' },
  { tone: 'neutral', title: 'shard 5: skipped' },
  { tone: 'running', title: 'shard 6' },
  { title: 'shard 7' },
]

export const notBegun: RunUnit[] = [{}, {}, {}, {}]
export const allDone: RunUnit[] = Array.from({ length: 5 }, (_, index) => ({ tone: 'ok' as const, title: `shard ${index + 1}` }))

/** The counters of the run, beside its phases. */
export const runCounters = [
  { label: 'Running', value: '7 min 58 s' },
  { label: 'Agents', value: '12' },
  { label: 'Tokens', value: '186 000' },
]
