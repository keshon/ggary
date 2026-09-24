import { daysBetween } from '../../utils/calendar'
import type { GanttDates, GanttLink, GanttRange, GanttRow, GanttScale, GanttState, GanttTask, LinkPoint } from './gantt.types'
import { datesFor, groupOf, rowsOf } from './gantt.machine'

/**
 * A group's summary: its first task's start to its last one's end — as they
 * show, a change being made included — and how far along, each task weighed
 * by its days. Null for a group with no tasks.
 */
export function summaryOf(state: GanttState, tasks: GanttTask[]): (GanttDates & { progress: number | undefined }) | null {
  if (tasks.length === 0) return null
  let start = ''
  let end = ''
  let done = 0
  let total = 0
  let measured = false
  for (const task of tasks) {
    const dates = datesFor(state, task)
    if (!start || dates.start < start) start = dates.start
    if (!end || dates.end > end) end = dates.end
    if (task.milestone) continue
    const days = daysBetween(dates.start, dates.end) + 1
    total += days
    done += days * Math.max(0, Math.min(1, task.progress ?? 0))
    if (task.progress !== undefined) measured = true
  }
  return { start, end, progress: measured && total > 0 ? done / total : undefined }
}

/** Days of room a straight run needs at each scale, so the arrow does not cut back through a bar. */
const ROOM: Record<GanttScale, number> = { day: 1, week: 2, month: 5 }

/**
 * Each dependency as an arrow from the end of the task waited for to the
 * start of the one waiting. With room between them it runs across, down and
 * in; with none — or when the task starts before the other ends — it steps
 * out, runs between the rows, and comes back in, so it never cuts a bar.
 */
export function linksOf(state: GanttState, range: GanttRange, rows: GanttRow[] = rowsOf(state)): GanttLink[] {
  const rowAt = new Map(rows.map((row, i) => [row.id, i]))
  const byId = new Map(state.tasks.map((task) => [task.id, task]))
  // Where an end of an arrow is: a task's own row — or, in a closed group, its
  // group's, at the task's own days — or a group's row, at its summary's.
  const place = (id: string) => {
    const task = byId.get(id)
    if (task) {
      const group = groupOf(state, task)
      const row = rowAt.get(id) ?? (group === null ? undefined : rowAt.get(group))
      return row === undefined ? null : { row, dates: datesFor(state, task), milestone: !!task.milestone }
    }
    const row = rows[rowAt.get(id) ?? -1]
    const summary = row?.kind === 'group' ? summaryOf(state, row.tasks) : null
    return summary ? { row: rowAt.get(id)!, dates: summary, milestone: false } : null
  }
  const links: GanttLink[] = []
  for (const task of state.tasks) {
    for (const id of task.dependsOn ?? []) {
      if (id === task.id) continue
      const before = place(id)
      const after = place(task.id)
      // Both in one closed group: nothing to draw between a row and itself.
      if (!before || !after || before.row === after.row) continue
      const a = before.dates
      const b = after.dates
      const rowA = before.row
      const rowB = after.row
      const yA = rowA + 0.5
      const yB = rowB + 0.5
      // A bar is left and entered at its edges; a milestone at its tips, a
      // gap either side of its middle.
      const fromX = before.milestone ? daysBetween(range.start, a.start) + 0.5 : daysBetween(range.start, a.end) + 1
      const toX = daysBetween(range.start, b.start) + (after.milestone ? 0.5 : 0)
      const out = before.milestone ? 1 : 0
      const into = after.milestone ? -1 : 0
      // A bar must start after the day the other ends; a milestone is a point in
      // time, so a task may start on its day, and a milestone fall on a bar's last.
      const conflict = before.milestone ? b.start < a.start : after.milestone ? b.start < a.end : b.start <= a.end
      const roomy = toX - fromX >= ROOM[state.scale]
      const seam = rowB > rowA ? rowB : rowB + 1
      const points: LinkPoint[] = roomy
        ? [
            { x: fromX, gap: out, y: yA },
            { x: toX, gap: into - 1, y: yA },
            { x: toX, gap: into - 1, y: yB },
            { x: toX, gap: into, y: yB },
          ]
        : [
            { x: fromX, gap: out, y: yA },
            { x: fromX, gap: out + 1, y: yA },
            { x: fromX, gap: out + 1, y: seam },
            { x: toX, gap: into - 1, y: seam },
            { x: toX, gap: into - 1, y: yB },
            { x: toX, gap: into, y: yB },
          ]
      links.push({ from: id, to: task.id, conflict, points })
    }
  }
  return links
}
