import type { Lane } from '@ggary/core/lanes'

/** The shards of run 4127 on one axis: 0 s is 02:14:52, and shard 4 is still going. */
export const runLanes: Lane[] = [
  {
    id: 'shard-1',
    label: 'shard 1',
    spans: [
      { label: 'unit tests', start: 0, end: 38_000, tone: 'ok' },
      { label: 'coverage', start: 38_000, end: 47_000, tone: 'ok' },
    ],
  },
  { id: 'shard-2', label: 'shard 2', spans: [{ label: 'unit tests', start: 1000, end: 52_000, tone: 'ok' }] },
  {
    id: 'shard-3',
    label: 'shard 3',
    spans: [
      { label: 'unit tests', start: 1000, end: 44_000, tone: 'warn' },
      { label: 'retry', start: 46_000, end: 61_000, tone: 'ok' },
    ],
  },
  {
    id: 'shard-4',
    label: 'shard 4',
    spans: [
      { label: 'unit tests', start: 2000, end: 57_000, tone: 'error' },
      { label: 'the agent’s edit', start: 70_000, end: 109_000, tone: 'neutral' },
      { label: 'unit tests, again', start: 109_000, end: 126_000, tone: 'running' },
    ],
  },
  { id: 'shard-5', label: 'shard 5', spans: [{ label: 'unit tests', start: 2000, end: 40_000, tone: 'ok' }] },
  { id: 'shard-6', label: 'shard 6', spans: [{ label: 'unit tests', start: 3000, end: 35_000, tone: 'ok' }] },
]

/** Three workers, one of which was never given anything. */
export const idleLanes: Lane[] = [
  { id: 'agent-01', label: 'agent-01', spans: [{ label: 'reading files', start: 0, end: 3400, tone: 'ok' }, { label: 'editing', start: 3400, end: 9200, tone: 'ok' }] },
  { id: 'agent-02', label: 'agent-02', spans: [{ label: 'reading files', start: 600, end: 5100, tone: 'ok' }, { label: 'running tests', start: 5100, end: 12_000, tone: 'running' }] },
  { id: 'agent-03', label: 'agent-03', spans: [] },
]
