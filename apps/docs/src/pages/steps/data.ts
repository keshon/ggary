import type { Step } from '@ggary/core/steps'

/** An import, part way through. */
export const importing: Step[] = [
  { name: 'Source', state: 'done' },
  { name: 'Rules', state: 'done' },
  { name: 'Check', state: 'current' },
  { name: 'Launch', state: 'todo' },
]

export const imported: Step[] = importing.map((step) => ({ ...step, state: 'done' }))

export const notStarted: Step[] = importing.map((step, index) => ({ ...step, state: index === 0 ? 'current' : 'todo' }))

/** The same, each state in the import's own words. */
export const noted: Step[] = [
  { name: 'Source', note: '1 240 rows', state: 'done' },
  { name: 'Rules', note: '3 applied', state: 'done' },
  { name: 'Check', note: '2 warnings', state: 'current' },
  { name: 'Launch', note: 'Waiting', state: 'todo' },
]
