import type { TaskItem } from '@ggary/core/task'

/** The queue of agents: flat rows, a phase each, arriving while the work goes on. */
export const runTasks: TaskItem[] = [
  { value: 'docs-drift', title: 'analysis:docs-drift', detail: 'docs/ · 4 calls', meta: '18 s', state: 'done' },
  { value: 'probes-assert', title: 'analysis:probes-assert', detail: '2 probes assert nothing', meta: '18 s', state: 'warn' },
  { value: 'coverage-hole', title: 'analysis:coverage-hole', detail: 'the third pass is going', meta: '14.0 s', state: 'running' },
  { value: 'history', title: 'analysis:history', detail: 'waiting for a free runner', meta: '—', state: 'queued' },
  { value: 'link-check', title: 'report:link-check', detail: 'the network is off', meta: '0.4 s', state: 'failed' },
  { value: 'screenshots', title: 'report:screenshots', detail: 'skipped by a flag', meta: '—', state: 'skipped' },
]

/** A shorter queue, one of whose tasks cannot be chosen. */
export const lockedTasks: TaskItem[] = [
  { value: 'docs-drift', title: 'analysis:docs-drift', detail: 'docs/ · 4 calls', meta: '18 s', state: 'done' },
  { value: 'shared-and-chunk', title: 'analysis:shared-and-chunk', detail: 'kept by another run', meta: '—', state: 'queued', disabled: true },
  { value: 'silent-failure', title: 'analysis:silent-failure', detail: 'src/runtime/ · 4 calls', meta: '18 s', state: 'done' },
]

/** The whole queue of the run, for the panel. */
export const allTasks: TaskItem[] = [
  ...runTasks.slice(0, 1),
  { value: 'shared-and-chunk', title: 'analysis:shared-and-chunk', detail: 'src/shared/ · 5 calls', meta: '18 s', state: 'done' },
  ...runTasks.slice(1, 2),
  { value: 'silent-failure', title: 'analysis:silent-failure', detail: 'src/runtime/ · 4 calls', meta: '18 s', state: 'done' },
  ...runTasks.slice(2, 4),
  { value: 'eyes-only', title: 'analysis:eyes-only', detail: 'waiting for a free runner', meta: '—', state: 'queued' },
  { value: 'refutation-a', title: 'refutation:class-a', detail: 'waiting for the analysis', meta: '—', state: 'queued' },
  ...runTasks.slice(4),
]
