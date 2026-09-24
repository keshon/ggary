import type { IconName } from '@ggary/icons'
import type { Dict, Normalizer } from '../../types'
import { daysBetween, formatDate, todayISO, weekday, type ISODate } from '../../utils/calendar'
import { ganttAnatomy } from './gantt.anatomy'
import type { GanttDates, GanttEvent, GanttGroup, GanttLink, GanttScale, GanttState, GanttTask, GanttWords, LinkPoint, ScaleCell } from './gantt.types'
import { datesFor, rowsOf, tabStop } from './gantt.machine'
import { rangeOf, scaleRows } from './gantt.scale'
import { linksOf, summaryOf } from './gantt.links'

const PAGE = 10

/** A header cell of fewer days than this cannot hold its name at the scale. */
const NARROW: Record<GanttScale, number> = { day: 3, week: 8, month: 25 }

export const GANTT_WORDS: GanttWords = {
  label: 'Schedule',
  task: 'Task',
  schedule: (range) => `Schedule, ${range}`,
  describe: (task, dates, days) =>
    `${dates}, ${days === 1 ? '1 day' : `${days} days`}${task.progress === undefined ? '' : `, ${Math.round(task.progress * 100)}% done`}`,
  milestone: (date) => `Milestone, ${date}`,
  empty: 'No tasks',
  today: 'Today',
  instructions: 'Left and Right move the task a day, with Shift a week; with Alt they move its end. Enter or a pause keeps the change, Escape puts it back.',
  changed: (title, dates) => `${title}: ${dates}`,
  cancelled: (title, dates) => `${title} put back: ${dates}`,
  failed: (title, message) => (message ? `${title} was not changed: ${message}` : `${title} was not changed.`),
  after: (titles) => `after ${titles.join(', ')}`,
  conflict: (titles) => `starts before ${titles.join(', ')} ${titles.length === 1 ? 'ends' : 'end'}`,
  group: (count, dates, days, progress) =>
    count === 0
      ? 'No tasks'
      : `${count === 1 ? '1 task' : `${count} tasks`}, ${dates}, ${days === 1 ? '1 day' : `${days} days`}${progress === undefined ? '' : `, ${Math.round(progress * 100)}% done`}`,
}

const idPart = (value: string) => value.replace(/[^\w-]/g, (char) => `_${char.charCodeAt(0).toString(16)}`)

export const ganttIds = (id: string) => ({
  root: id,
  schedule: (task: string) => `${id}-schedule-${idPart(task)}`,
  title: (task: string) => `${id}-title-${idPart(task)}`,
  instructions: `${id}-instructions`,
})

/** A range in the locale's words: "18 Sep – 25 Sep 2026", or one day when it starts and ends on it. */
function formatRange(start: ISODate, end: ISODate, locale?: string): string {
  if (start === end) return formatDate(start, locale)
  const sameYear = start.slice(0, 4) === end.slice(0, 4)
  return `${formatDate(start, locale, sameYear ? { day: 'numeric', month: 'short' } : undefined)} – ${formatDate(end, locale)}`
}

export function connect<T extends GanttTask, P = Dict>(state: GanttState<T>, send: (event: GanttEvent) => void, normalize: Normalizer<P>, options: { words?: Partial<GanttWords> } = {}) {
  const { words = {} } = options
  const w = { ...GANTT_WORDS, ...words }
  const ids = ganttIds(state.id)
  const range = state.range ?? rangeOf(state.tasks, state.scale, state.locale)
  const days = daysBetween(range.start, range.end) + 1
  const [wide, bottom] = scaleRows(range, state.scale, state.locale)
  // Only the top row is cut short, at the chart's edges; the bottom row's cells are whole.
  const top = wide.map((cell) => (cell.span < NARROW[state.scale] ? { ...cell, narrow: true } : cell))
  const today = todayISO()
  const todayAt = daysBetween(range.start, today)
  const stop = tabStop(state)
  // The first Saturday's place from the range's start: the weekend's stripes line up on it.
  const weekendAt = (6 - weekday(range.start) + 7) % 7

  const rows = rowsOf(state)
  const rowIndex = new Map(rows.map((row, i) => [row.id, i]))
  const grouped = state.groups.length > 0
  const titleOf = (id: string) => state.tasks.find((task) => task.id === id)?.title ?? state.groups.find((group) => group.id === id)?.title ?? id
  const said = state.announcement.value
  const announcement = !said
    ? ''
    : said.kind === 'failed'
      ? w.failed(titleOf(said.task), said.message)
      : (said.kind === 'cancelled' ? w.cancelled : w.changed)(titleOf(said.task), formatRange(said.dates.start, said.dates.end, state.locale))
  const pendingTasks = new Set(state.pending.map((change) => change.task))
  const links = linksOf(state, range, rows)
  const focused = stop
  const place = (dates: GanttDates) => {
    const start = daysBetween(range.start, dates.start)
    const span = Math.max(1, daysBetween(dates.start, dates.end) + 1)
    return {
      // Cut at the chart's edges: a bar that runs on past them says so.
      'data-before': start < 0 ? '' : undefined,
      'data-after': start + span > days ? '' : undefined,
      style: { '--gg-gantt-start': Math.max(0, start), '--gg-gantt-span': Math.max(0, Math.min(days, start + span) - Math.max(0, start)) },
    }
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const rtl = (event.currentTarget as Element | null)?.closest?.('[dir]')?.getAttribute('dir') === 'rtl'
    const step = event.shiftKey ? 7 : 1
    const later = rtl ? 'ArrowLeft' : 'ArrowRight'
    const earlier = rtl ? 'ArrowRight' : 'ArrowLeft'
    const keys: Record<string, GanttEvent> = {
      ArrowDown: { type: 'WALK', step: 1 },
      ArrowUp: { type: 'WALK', step: -1 },
      PageDown: { type: 'WALK', step: PAGE },
      PageUp: { type: 'WALK', step: -PAGE },
      Home: { type: 'EDGE', edge: 'first' },
      End: { type: 'EDGE', edge: 'last' },
      Enter: state.draft ? { type: 'COMMIT' } : { type: 'OPEN' },
      [later]: { type: 'NUDGE', edge: event.altKey ? 'end' : 'move', days: step },
      [earlier]: { type: 'NUDGE', edge: event.altKey ? 'end' : 'move', days: -step },
    }
    if (event.key === 'Escape' && state.draft) {
      event.preventDefault()
      send({ type: 'CANCEL' })
      return
    }
    const own = (event.currentTarget as HTMLElement | null)?.dataset?.task ?? stop
    const row = rows[rowIndex.get(own ?? '') ?? -1]
    // On a group's heading the arrows across open and close it, and Enter does either.
    if (row?.kind === 'group') {
      keys[later] = { type: 'TOGGLE', group: row.id, open: true }
      keys[earlier] = row.open ? { type: 'TOGGLE', group: row.id, open: false } : { type: 'WALK', step: 0 }
      keys.Enter = { type: 'TOGGLE', group: row.id }
    } else if (!state.editable && row?.group) {
      // A chart whose bars stay put: back from a task to its group's heading.
      keys[earlier] = { type: 'PARENT' }
    }
    const sent = keys[event.key]
    const arrow = event.key === later || event.key === earlier
    if (!sent || event.metaKey || event.ctrlKey || (event.altKey && !arrow)) return
    if (arrow && sent.type === 'NUDGE' && !state.editable) return
    event.preventDefault()
    // A key comes from the row that has the focus, whatever the chart last heard.
    if (own && own !== state.focus.task) send({ type: 'FOCUS', task: own })
    send(sent)
  }

  return {
    ids,
    words: w,
    range,
    days,
    scale: state.scale,
    tasks: state.tasks,
    /** What to draw, top to bottom: tasks, and groups' headings. */
    rows,
    top,
    bottom,
    todayInRange: todayAt >= 0 && todayAt < days,
    editable: state.editable,
    announcement,
    /** The dates a task shows: a change being made to it, or still out, over its own. */
    datesOf: (task: T) => datesFor(state, task),
    /** Watch this: when it changes, move real focus to `focusTask`'s schedule cell. */
    focusNonce: state.focus.nonce,
    focusTask: state.focus.task,
    setScale: (scale: GanttScale) => send({ type: 'SCALE', scale }),

    rootProps: normalize({
      ...ganttAnatomy.attrs('root'),
      id: ids.root,
      role: grouped ? 'treegrid' : 'grid',
      'aria-label': w.label,
      'aria-rowcount': rows.length + 1,
      'data-scale': state.scale,
      style: { '--gg-gantt-days': days, '--gg-gantt-weekend': weekendAt },
    }),
    headerProps: normalize({ ...ganttAnatomy.attrs('header'), role: 'row', 'aria-rowindex': 1 }),
    cornerProps: normalize({ ...ganttAnatomy.attrs('corner'), role: 'columnheader' }),
    scaleProps: normalize({
      ...ganttAnatomy.attrs('scale'),
      role: 'columnheader',
      'aria-label': w.schedule(formatRange(range.start, range.end, state.locale)),
    }),
    getScaleRowProps: (which: 'top' | 'bottom') => normalize({ ...ganttAnatomy.attrs('scale-row'), 'data-row': which, 'aria-hidden': 'true' }),
    getScaleCellProps: (cell: ScaleCell) =>
      normalize({
        ...ganttAnatomy.attrs('scale-cell'),
        title: cell.title,
        'data-weekend': cell.weekend ? '' : undefined,
        'data-today': cell.today ? '' : undefined,
        'data-narrow': cell.narrow ? '' : undefined,
        style: { '--gg-gantt-start': cell.start, '--gg-gantt-span': cell.span },
      }),
    bodyProps: normalize({ ...ganttAnatomy.attrs('body'), role: 'rowgroup' }),
    getRowProps: (task: T) => {
      const row = rows[rowIndex.get(task.id) ?? -1]
      return normalize({
        ...ganttAnatomy.attrs('row'),
        role: 'row',
        'aria-rowindex': (rowIndex.get(task.id) ?? 0) + 2,
        'aria-level': grouped ? (row?.level ?? 1) : undefined,
        'data-task': task.id,
        'data-level': grouped ? (row?.level ?? 1) : undefined,
      })
    },
    getTitleProps: (task: T) => normalize({ ...ganttAnatomy.attrs('title'), id: ids.title(task.id), role: 'rowheader' }),
    getScheduleProps: (task: T) =>
      normalize({
        ...ganttAnatomy.attrs('schedule'),
        id: ids.schedule(task.id),
        role: 'gridcell',
        tabIndex: task.id === stop ? 0 : -1,
        'aria-describedby': state.editable && !task.locked ? ids.instructions : undefined,
        'data-task': task.id,
        onKeyDown,
        onFocusIn: (event: FocusEvent) => {
          if (event.target === event.currentTarget) send({ type: 'FOCUS', task: task.id })
        },
        onDoubleClick: () => send({ type: 'OPEN', task: task.id }),
      }),
    /** The schedule in words, for a screen reader; the bar shows it to the eye. */
    describe: (task: T) => {
      const { start, end } = datesFor(state, task)
      const schedule = task.milestone ? w.milestone(formatDate(start, state.locale)) : w.describe(task, formatRange(start, end, state.locale), daysBetween(start, end) + 1)
      const waits = links.filter((link) => link.to === task.id)
      if (waits.length === 0) return schedule
      const late = waits.filter((link) => link.conflict).map((link) => titleOf(link.from))
      const after = w.after(waits.map((link) => titleOf(link.from)))
      return late.length ? `${schedule}, ${after}; ${w.conflict(late)}` : `${schedule}, ${after}`
    },
    links,
    linksProps: normalize({ ...ganttAnatomy.attrs('links'), 'aria-hidden': 'true' }),
    getLinkProps: (link: GanttLink) =>
      normalize({
        ...ganttAnatomy.attrs('link'),
        'data-from': link.from,
        'data-to': link.to,
        'data-conflict': link.conflict ? '' : undefined,
        // The arrows of the task the keyboard is on stand out.
        'data-active': focused !== null && state.focus.task !== null && (link.from === focused || link.to === focused) ? '' : undefined,
      }),
    /** The arrow's straight runs, each between two of its corners. */
    segmentsOf: (link: GanttLink) => link.points.slice(1).map((point, i) => [link.points[i], point] as const),
    getSegmentProps: ([a, b]: readonly [LinkPoint, LinkPoint]) =>
      normalize({
        ...ganttAnatomy.attrs('link-segment'),
        'data-axis': a.y === b.y ? 'x' : 'y',
        style: { '--gg-gantt-x1': a.x, '--gg-gantt-x1-gap': a.gap, '--gg-gantt-x2': b.x, '--gg-gantt-x2-gap': b.gap, '--gg-gantt-y1': a.y, '--gg-gantt-y2': b.y },
      }),
    getHeadProps: (link: GanttLink) => {
      const end = link.points[link.points.length - 1]
      return normalize({ ...ganttAnatomy.attrs('link-head'), style: { '--gg-gantt-x1': end.x, '--gg-gantt-x1-gap': end.gap, '--gg-gantt-y1': end.y } })
    },
    scheduleTextProps: normalize({ ...ganttAnatomy.attrs('schedule-text') }),

    /** A group's heading row: its title, then its summary. */
    getGroupRowProps: (group: GanttGroup) => {
      const row = rows[rowIndex.get(group.id) ?? -1]
      const open = row?.kind === 'group' ? row.open : true
      return normalize({
        ...ganttAnatomy.attrs('row'),
        role: 'row',
        'aria-rowindex': (rowIndex.get(group.id) ?? 0) + 2,
        'aria-level': 1,
        'aria-expanded': open ? 'true' : 'false',
        'data-group': group.id,
        'data-level': 1,
        'data-state': open ? 'open' : 'closed',
      })
    },
    getGroupTitleProps: (group: GanttGroup) =>
      normalize({
        ...ganttAnatomy.attrs('title'),
        id: ids.title(group.id),
        role: 'rowheader',
        'data-group': group.id,
        // The heading's name opens and closes it, as the keys do.
        onClick: () => send({ type: 'TOGGLE', group: group.id }),
      }),
    getGroupToggleProps: (group: GanttGroup) =>
      normalize({
        ...ganttAnatomy.attrs('group-toggle'),
        'aria-hidden': 'true',
        'data-icon': 'chevron-right' satisfies IconName,
        'data-state': state.collapsed.includes(group.id) ? 'closed' : 'open',
      }),
    getGroupScheduleProps: (group: GanttGroup) =>
      normalize({
        ...ganttAnatomy.attrs('schedule'),
        id: ids.schedule(group.id),
        role: 'gridcell',
        tabIndex: group.id === stop ? 0 : -1,
        'aria-expanded': state.collapsed.includes(group.id) ? 'false' : 'true',
        'data-task': group.id,
        'data-group': group.id,
        onKeyDown,
        onFocusIn: (event: FocusEvent) => {
          if (event.target === event.currentTarget) send({ type: 'FOCUS', task: group.id })
        },
        onDoubleClick: () => send({ type: 'TOGGLE', group: group.id }),
      }),
    /** A group's summary in words, for a screen reader; its bar shows it to the eye. */
    describeGroup: (group: GanttGroup) => {
      const row = rows[rowIndex.get(group.id) ?? -1]
      const tasks = row?.kind === 'group' ? row.tasks : []
      const summary = summaryOf(state, tasks)
      return w.group(tasks.length, summary && formatRange(summary.start, summary.end, state.locale), summary ? daysBetween(summary.start, summary.end) + 1 : 0, summary?.progress)
    },
    /** The group's summary bar, or null when it has no tasks. */
    getSummaryProps: (group: GanttGroup) => {
      const row = rows[rowIndex.get(group.id) ?? -1]
      const summary = row?.kind === 'group' ? summaryOf(state, row.tasks) : null
      if (!summary) return null
      return normalize({
        ...ganttAnatomy.attrs('summary'),
        'aria-hidden': 'true',
        'data-group': group.id,
        'data-done': summary.progress !== undefined && summary.progress >= 1 ? '' : undefined,
        ...place(summary),
      })
    },
    getSummaryProgressProps: (group: GanttGroup) => {
      const row = rows[rowIndex.get(group.id) ?? -1]
      const summary = row?.kind === 'group' ? summaryOf(state, row.tasks) : null
      return normalize({ ...ganttAnatomy.attrs('summary-progress'), style: { '--gg-progress': Math.round((summary?.progress ?? 0) * 1000) / 1000 } })
    },
    getBarProps: (task: T) =>
      normalize({
        ...ganttAnatomy.attrs(task.milestone ? 'milestone' : 'bar'),
        'aria-hidden': 'true',
        'data-task': task.id,
        'data-editable': state.editable && !task.locked ? '' : undefined,
        'data-drafting': state.draft?.task === task.id ? '' : undefined,
        'data-pending': pendingTasks.has(task.id) ? '' : undefined,
        'data-done': task.progress !== undefined && task.progress >= 1 ? '' : undefined,
        ...place(datesFor(state, task)),
      }),
    getBarProgressProps: (task: T) =>
      normalize({ ...ganttAnatomy.attrs('bar-progress'), style: { '--gg-progress': Math.max(0, Math.min(1, task.progress ?? 0)) } }),
    barLabelProps: normalize({ ...ganttAnatomy.attrs('bar-label') }),
    /** A bar's ends, to take hold of with a pointer and resize it. Drawn only on a bar that may change. */
    showGrips: (task: T) => state.editable && !task.locked && !task.milestone,
    getGripProps: (edge: 'start' | 'end') => normalize({ ...ganttAnatomy.attrs(edge === 'start' ? 'bar-start' : 'bar-end'), 'aria-hidden': 'true' }),
    liveProps: normalize({ ...ganttAnatomy.attrs('live'), 'aria-live': 'assertive', 'aria-atomic': 'true' }),
    instructionsProps: normalize({ ...ganttAnatomy.attrs('instructions'), id: ids.instructions }),
    todayProps: normalize({ ...ganttAnatomy.attrs('today'), 'aria-hidden': 'true', title: w.today, style: { '--gg-gantt-start': todayAt } }),
    emptyProps: normalize({ ...ganttAnatomy.attrs('empty') }),
  }
}

export type GanttApi<T extends GanttTask = GanttTask, P = Dict> = ReturnType<typeof connect<T, P>>

/**
 * Move real focus to a task's schedule cell and bring its bar into view: the
 * chart scrolls both ways, and the list stands over its left edge, which the
 * theme's scroll padding keeps clear.
 */
export function focusGanttTask(doc: Document, scheduleId: string): void {
  const cell = doc.getElementById(scheduleId)
  if (!cell) return
  if (doc.activeElement !== cell) cell.focus({ preventScroll: true })
  const bar = cell.querySelector<HTMLElement>('[data-part="bar"], [data-part="milestone"], [data-part="summary"]') ?? cell
  if (typeof bar.scrollIntoView === 'function') bar.scrollIntoView({ block: 'nearest', inline: 'nearest' })
}

/**
 * Scroll the chart sideways so today stands a third of the way in — or, when
 * today is not in the chart, so its first bar does. Measured, so it holds at
 * whatever width the theme gives a day.
 */
export function revealGanttDay(root: HTMLElement | null): void {
  if (!root) return
  const target = root.querySelector<HTMLElement>('[data-part="today"]') ?? root.querySelector<HTMLElement>('[data-part="bar"], [data-part="milestone"]')
  if (!target) return
  const list = root.querySelector<HTMLElement>('[data-part="corner"]')?.getBoundingClientRect().width ?? 0
  const at = target.getBoundingClientRect().left - root.getBoundingClientRect().left + root.scrollLeft - list
  const room = root.clientWidth - list
  root.scrollLeft = Math.max(0, at - room / 3)
}
