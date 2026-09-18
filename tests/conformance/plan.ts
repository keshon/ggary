import type { GanttTask } from '../../packages/core/src/components/gantt'

/** The plan in every Gantt test: fixed days, so what a range and a bar come to never moves with today. */
export const plan: GanttTask[] = [
  { id: 'brief', title: 'Write the brief', start: '2026-09-07', end: '2026-09-09', progress: 1 },
  { id: 'design', title: 'Design the flow', start: '2026-09-10', end: '2026-09-18', progress: 0.4 },
  { id: 'review', title: 'Review with the client', start: '2026-09-21', end: '2026-09-21', milestone: true },
  { id: 'build', title: 'Build the import', start: '2026-09-21', end: '2026-10-09', progress: 0 },
]

/** A range fixed around the plan. */
export const planRange = { start: '2026-09-01', end: '2026-10-15' }
