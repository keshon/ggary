import type { HistoryGroup, HistoryTick } from '@ggary/core/history'

/** The same workflow by the hour: a batch is an hour, and its width is how many runs stand behind it. */
export const runHistoryHours: HistoryGroup[] = [
  { label: '02', ticks: [{ tone: 'ok' }], title: '02:00 — 1 run' },
  { label: '03', minor: true, ticks: [{ tone: 'ok' }, { tone: 'ok' }, { tone: 'ok' }], title: '03:00 — 3 runs' },
  { label: '04', minor: true, ticks: [{ tone: 'error' }, { tone: 'error' }, { tone: 'ok' }, { tone: 'ok' }, { tone: 'ok' }], title: '04:00 — 5 runs' },
  { label: '05', ticks: [{ tone: 'ok' }], count: 8, title: '05:00 — 8 runs, shown as one' },
  { label: '06', minor: true, ticks: [{ empty: true }], title: '06:00 — no runs' },
  { label: '07', minor: true, ticks: [{ tone: 'ok' }, { tone: 'warn' }, { tone: 'ok' }], title: '07:00 — 3 runs' },
  { label: '08', ticks: [{ tone: 'ok' }, { tone: 'ok' }, { tone: 'running' }], title: '08:00 — 3 runs' },
]

/** Every way an attempt can end, and one nobody made. */
export const everyTick: HistoryTick[] = [
  { tone: 'ok', title: 'passed' },
  { tone: 'ok', title: 'passed' },
  { tone: 'warn', title: 'passed with 2 remarks' },
  { tone: 'error', title: 'failed' },
  { empty: true, title: 'no run: the runner was down' },
  { title: 'the result was lost' },
  { tone: 'ok', title: 'passed' },
  { tone: 'running', title: 'going now' },
]

/** Three workflows and their last twelve nights, for a list of strips beside their names. */
export const workflows: { label: string; value: string; ticks: HistoryTick[] }[] = [
  { label: 'Nightly audit', value: 'audit', ticks: [...Array.from({ length: 10 }, () => ({ tone: 'ok' as const })), { tone: 'error' }, { tone: 'running' }] },
  { label: 'Link check', value: 'links', ticks: [...Array.from({ length: 5 }, () => ({ tone: 'ok' as const })), { tone: 'warn' }, { tone: 'warn' }, ...Array.from({ length: 5 }, () => ({ tone: 'ok' as const }))] },
  { label: 'Screenshots', value: 'screenshots', ticks: [...Array.from({ length: 4 }, () => ({ tone: 'ok' as const })), ...Array.from({ length: 6 }, () => ({ empty: true })), { tone: 'ok' }, { tone: 'ok' }] },
]
