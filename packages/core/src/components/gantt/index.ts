import { createMachine, withEffects, type Machine } from '../../machine'
import { createAnatomy, type Dict, type Normalizer } from '../../types'
export { attachGanttDrag } from './drag'
import { addDays, addMonths, daysBetween, formatDate, startOfMonth, startOfWeek, todayISO, weekday, weekStartOf, type ISODate } from '../../utils/calendar'

/**
 * A Gantt chart: tasks as bars on a time scale, a list of their names beside
 * them.
 *
 * Everything here is counted in days — where a bar starts, how many days it
 * spans, how many the chart shows, where today is — and handed to CSS as
 * custom properties. The theme says how wide a day is at each scale, so the
 * same chart is a fortnight on a laptop or a year at the month scale without
 * the core knowing a pixel.
 *
 * To a screen reader it is a grid: a row per task, its name the row's header,
 * its schedule a cell that says the dates in words ("18 Sep – 25 Sep 2026,
 * 8 days, 40% done") while the bar shows them to the eye. One tab stop; Up
 * and Down walk the tasks, Home and End, PageUp and PageDown; Enter opens one.
 */

export interface GanttTask {
  id: string
  title: string
  /** The first day, YYYY-MM-DD. */
  start: ISODate
  /** The last day, included: a task on one day starts and ends on it. */
  end: ISODate
  /** How far along, 0 to 1. */
  progress?: number
  /** A point in time, not a stretch of it: drawn as a diamond on its day. */
  milestone?: boolean
  /** Not to be moved or resized: its bar has no grips, and the keys leave it. */
  locked?: boolean
  /** The tasks that must finish before this one starts: an arrow from each. */
  dependsOn?: string[]
}

export interface GanttDates {
  start: ISODate
  end: ISODate
}

/** What a change takes hold of: the whole bar, or one of its ends. */
export type GanttEdge = 'move' | 'start' | 'end'

export interface GanttChange<T extends GanttTask = GanttTask> {
  task: T
  from: GanttDates
  to: GanttDates
}

/** A change being made: shown at once, handed over when it is done. */
interface Draft {
  task: string
  edge: GanttEdge
  offset: number
  origin: GanttDates
  by: 'keyboard' | 'pointer'
  nonce: number
}

interface PendingChange {
  id: number
  task: string
  from: GanttDates
  to: GanttDates
  /** Answered, and waiting for the owner's new tasks to show it. */
  settled: boolean
}

export type GanttAnnouncement =
  | { kind: 'draft' | 'changed' | 'cancelled'; task: string; dates: GanttDates }
  | { kind: 'failed'; task: string; message: string }

export type GanttScale = 'day' | 'week' | 'month'

export interface GanttRange {
  start: ISODate
  end: ISODate
}

export interface GanttState<T extends GanttTask = GanttTask> {
  id: string
  tasks: T[]
  scale: GanttScale
  /** Fixed by the owner, or null to fit the tasks. */
  range: GanttRange | null
  locale: string | undefined
  focus: { task: string | null; nonce: number }
  openIntent: { value: string | null; nonce: number }
  scaleIntent: { value: GanttScale; nonce: number }
  scaleControlled: boolean
  /** Whether bars may be moved and resized: there is someone to hand a change to. */
  editable: boolean
  draft: Draft | null
  pending: PendingChange[]
  changeIntent: { value: PendingChange | null; nonce: number }
  announcement: { value: GanttAnnouncement | null; nonce: number }
}

export type GanttEvent =
  | { type: 'FOCUS'; task: string }
  | { type: 'WALK'; step: number }
  | { type: 'EDGE'; edge: 'first' | 'last' }
  | { type: 'OPEN'; task?: string }
  | { type: 'SCALE'; scale: GanttScale }
  | { type: 'SYNC_TASKS'; tasks: GanttTask[] }
  | { type: 'SYNC_SCALE'; scale: GanttScale }
  | { type: 'SYNC_OPTIONS'; range?: GanttRange | null; locale?: string; editable?: boolean }
  /** The keyboard: move the focused task, or its end, by some days more. */
  | { type: 'NUDGE'; edge: GanttEdge; days: number }
  /** A pointer: the task, or one of its ends, is this many days from where the drag began. */
  | { type: 'DRAG'; task: string; edge: GanttEdge; offset: number }
  /** Keep the change being made. */
  | { type: 'COMMIT' }
  /** Put the change being made back. */
  | { type: 'CANCEL' }
  | { type: 'SETTLE'; change: number; ok: boolean; message?: string }

export const ganttAnatomy = createAnatomy('gantt', [
  'root',
  'header',
  'corner',
  'scale',
  'scale-row',
  'scale-cell',
  'body',
  'row',
  'title',
  'schedule',
  'schedule-text',
  'bar',
  'bar-progress',
  'bar-label',
  'bar-start',
  'bar-end',
  'milestone',
  'links',
  'link',
  'link-segment',
  'link-head',
  'live',
  'instructions',
  'today',
  'empty',
] as const)
export type GanttPart = (typeof ganttAnatomy.parts)[number]

/** How much room a scale leaves around the tasks, and where it lines its edges up. */
const PADDING: Record<GanttScale, number> = { day: 3, week: 7, month: 14 }

/**
 * The days the chart shows: the tasks' first to last day with some room on
 * either side, lined up on the scale's own unit — a week's first day, a
 * month's — so the header's cells are whole.
 */
export function rangeOf(tasks: GanttTask[], scale: GanttScale, locale?: string, today: ISODate = todayISO()): GanttRange {
  const days = tasks.flatMap((task) => [task.start, task.end])
  const first = days.length ? days.reduce((a, b) => (a < b ? a : b)) : today
  const last = days.length ? days.reduce((a, b) => (a > b ? a : b)) : addDays(today, 27)
  let start = addDays(first, -PADDING[scale])
  let end = addDays(last, PADDING[scale])
  if (scale === 'week') {
    const weekStart = weekStartOf(locale)
    start = startOfWeek(start, weekStart)
    end = addDays(startOfWeek(end, weekStart), 6)
  } else if (scale === 'month') {
    start = startOfMonth(start)
    end = addDays(startOfMonth(addMonths(startOfMonth(end), 1)), -1)
  }
  return { start, end }
}

export interface ScaleCell {
  label: string
  /** A fuller name, for a screen reader and a tooltip: "September 2026". */
  title: string
  /** Days from the range's start. */
  start: number
  span: number
  /** A day of the weekend, at the day scale. */
  weekend?: boolean
  today?: boolean
  /** Too few days to hold its name at the scale: a month cut to a day at the chart's edge. */
  narrow?: boolean
}

/** Cells for one unit across a range: each day, each week, each month, each year — cut to the range. */
function cells(range: GanttRange, unit: 'day' | 'week' | 'month' | 'year', label: (day: ISODate) => [string, string], weekStart: number): ScaleCell[] {
  const out: ScaleCell[] = []
  const total = daysBetween(range.start, range.end) + 1
  const today = todayISO()
  let day = range.start
  while (daysBetween(range.start, day) < total) {
    const next =
      unit === 'day'
        ? addDays(day, 1)
        : unit === 'week'
          ? addDays(startOfWeek(day, weekStart), 7)
          : unit === 'month'
            ? startOfMonth(addMonths(startOfMonth(day), 1))
            : `${Number(day.slice(0, 4)) + 1}-01-01`
    const start = daysBetween(range.start, day)
    const span = Math.min(daysBetween(day, next), total - start)
    const [text, title] = label(day)
    const dow = weekday(day)
    out.push({ label: text, title, start, span, weekend: unit === 'day' && (dow === 0 || dow === 6) ? true : undefined, today: unit === 'day' && day === today ? true : undefined })
    day = next
  }
  return out
}

/** The scale's two header rows: months over days, months over weeks, years over months. */
export function scaleRows(range: GanttRange, scale: GanttScale, locale?: string): [ScaleCell[], ScaleCell[]] {
  const weekStart = weekStartOf(locale)
  const month = (day: ISODate): [string, string] => [formatDate(day, locale, { month: 'long', year: 'numeric' }), formatDate(day, locale, { month: 'long', year: 'numeric' })]
  if (scale === 'day') {
    return [
      cells(range, 'month', month, weekStart),
      cells(range, 'day', (day) => [String(Number(day.slice(8))), formatDate(day, locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })], weekStart),
    ]
  }
  if (scale === 'week') {
    return [
      cells(range, 'month', month, weekStart),
      cells(range, 'week', (day) => [formatDate(startOfWeek(day, weekStart), locale, { day: 'numeric', month: 'short' }), formatDate(startOfWeek(day, weekStart), locale, { day: 'numeric', month: 'long', year: 'numeric' })], weekStart),
    ]
  }
  return [
    cells(range, 'year', (day) => [day.slice(0, 4), day.slice(0, 4)], weekStart),
    cells(range, 'month', (day) => [formatDate(day, locale, { month: 'short' }), formatDate(day, locale, { month: 'long', year: 'numeric' })], weekStart),
  ]
}

const indexOf = (state: GanttState, id: string | null) => (id === null ? -1 : state.tasks.findIndex((task) => task.id === id))

/** The tab stop: the focused task while it is there, or the first. */
export function tabStop(state: GanttState): string | null {
  return indexOf(state, state.focus.task) !== -1 ? state.focus.task : (state.tasks[0]?.id ?? null)
}

const PAGE = 10

/** A header cell of fewer days than this cannot hold its name at the scale. */
const NARROW: Record<GanttScale, number> = { day: 3, week: 8, month: 25 }

/** The dates a change comes to: the whole bar moved, or one end, never past the other. */
export function datesOf(origin: GanttDates, edge: GanttEdge, offset: number, milestone = false): GanttDates {
  if (milestone || edge === 'move') {
    const start = addDays(origin.start, offset)
    return { start, end: milestone ? start : addDays(origin.end, offset) }
  }
  if (edge === 'start') {
    const start = addDays(origin.start, offset)
    return { start: start > origin.end ? origin.end : start, end: origin.end }
  }
  const end = addDays(origin.end, offset)
  return { start: origin.start, end: end < origin.start ? origin.start : end }
}

/** The dates a task shows: the change being made to it, else a change still out, else its own. */
export function datesFor(state: GanttState, task: GanttTask): GanttDates {
  if (state.draft && state.draft.task === task.id) return datesOf(state.draft.origin, state.draft.edge, state.draft.offset, task.milestone)
  const out = [...state.pending].reverse().find((change) => change.task === task.id)
  return out ? out.to : { start: task.start, end: task.end }
}

/**
 * A point of an arrow: `x` days from the chart's start and `gap` of the
 * theme's small gaps beside it — a pixel count the core does not know — and
 * `y` rows down, the half a row's middle.
 */
export interface LinkPoint {
  x: number
  gap: number
  y: number
}

export interface GanttLink {
  from: string
  to: string
  /** The task starts before the one it waits for has ended. */
  conflict: boolean
  /** The arrow's corners, first to last; the last is where its head is. */
  points: LinkPoint[]
}

/** Days of room a straight run needs at each scale, so the arrow does not cut back through a bar. */
const ROOM: Record<GanttScale, number> = { day: 1, week: 2, month: 5 }

/**
 * Each dependency as an arrow from the end of the task waited for to the
 * start of the one waiting. With room between them it runs across, down and
 * in; with none — or when the task starts before the other ends — it steps
 * out, runs between the rows, and comes back in, so it never cuts a bar.
 */
export function linksOf(state: GanttState, range: GanttRange): GanttLink[] {
  const index = new Map(state.tasks.map((task, i) => [task.id, i]))
  const links: GanttLink[] = []
  for (const task of state.tasks) {
    for (const id of task.dependsOn ?? []) {
      const before = state.tasks[index.get(id) ?? -1]
      if (!before || before.id === task.id) continue
      const a = datesFor(state, before)
      const b = datesFor(state, task)
      const rowA = index.get(before.id)!
      const rowB = index.get(task.id)!
      const yA = rowA + 0.5
      const yB = rowB + 0.5
      // A bar is left and entered at its edges; a milestone at its tips, a
      // gap either side of its middle.
      const fromX = before.milestone ? daysBetween(range.start, a.start) + 0.5 : daysBetween(range.start, a.end) + 1
      const toX = daysBetween(range.start, b.start) + (task.milestone ? 0.5 : 0)
      const out = before.milestone ? 1 : 0
      const into = task.milestone ? -1 : 0
      // A bar must start after the day the other ends; a milestone is a point in
      // time, so a task may start on its day, and a milestone fall on a bar's last.
      const conflict = before.milestone ? b.start < a.start : task.milestone ? b.start < a.end : b.start <= a.end
      const roomy = toX - fromX >= ROOM[state.scale]
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
            { x: fromX, gap: out + 1, y: rowB > rowA ? rowB : rowB + 1 },
            { x: toX, gap: into - 1, y: rowB > rowA ? rowB : rowB + 1 },
            { x: toX, gap: into - 1, y: yB },
            { x: toX, gap: into, y: yB },
          ]
      links.push({ from: before.id, to: task.id, conflict, points })
    }
  }
  return links
}

const editableTask = (state: GanttState, task: GanttTask | undefined) => !!task && state.editable && !task.locked

/** Keep the change being made: hand it over when it moved anything, and say so. */
function commit<T extends GanttTask>(state: GanttState<T>): GanttState<T> {
  const draft = state.draft
  if (!draft) return state
  const task = state.tasks.find((candidate) => candidate.id === draft.task)
  const done = { ...state, draft: null }
  if (!task) return done
  const to = datesOf(draft.origin, draft.edge, draft.offset, task.milestone)
  if (to.start === draft.origin.start && to.end === draft.origin.end) return done
  const change: PendingChange = { id: state.changeIntent.nonce + 1, task: task.id, from: draft.origin, to, settled: false }
  return {
    ...done,
    pending: [...state.pending, change],
    changeIntent: { value: change, nonce: change.id },
    announcement: { value: { kind: 'changed', task: task.id, dates: to }, nonce: state.announcement.nonce + 1 },
  }
}

/** The focus on the task at `index`, clamped to the list; real focus moves there. */
function focusAt<T extends GanttTask>(state: GanttState<T>, index: number): GanttState<T> {
  const task = state.tasks[Math.max(0, Math.min(state.tasks.length - 1, index))]
  return !task || task.id === state.focus.task ? state : { ...state, focus: { task: task.id, nonce: state.focus.nonce + 1 } }
}

export function reducer<T extends GanttTask>(state: GanttState<T>, event: GanttEvent): GanttState<T> {
  switch (event.type) {
    case 'FOCUS': {
      if (event.task === state.focus.task) return state
      // The focus went to another task: the change being made to this one is kept.
      const kept = state.draft && state.draft.task !== event.task ? commit(state) : state
      return { ...kept, focus: { task: event.task, nonce: kept.focus.nonce } }
    }
    case 'WALK': {
      const kept = commit(state)
      return focusAt(kept, indexOf(kept, tabStop(kept)) + event.step)
    }
    case 'EDGE': {
      const kept = commit(state)
      return focusAt(kept, event.edge === 'first' ? 0 : kept.tasks.length - 1)
    }
    case 'OPEN': {
      const task = event.task ?? tabStop(state)
      const kept = commit(state)
      return task ? { ...kept, openIntent: { value: task, nonce: kept.openIntent.nonce + 1 } } : kept
    }

    case 'NUDGE': {
      const id = tabStop(state)
      const task = state.tasks.find((candidate) => candidate.id === id)
      if (!task || !editableTask(state, task)) return state
      const edge = task.milestone ? 'move' : event.edge
      // Nudges of the same end add up; another end starts a change of its own.
      const base = state.draft && (state.draft.task !== task.id || state.draft.edge !== edge) ? commit(state) : state
      const same = base.draft && base.draft.task === task.id && base.draft.edge === edge ? base.draft : null
      const draft: Draft = same
        ? { ...same, offset: same.offset + event.days, nonce: same.nonce + 1 }
        : { task: task.id, edge, offset: event.days, origin: datesFor(base, task), by: 'keyboard', nonce: (base.draft?.nonce ?? 0) + 1 }
      const dates = datesOf(draft.origin, draft.edge, draft.offset, task.milestone)
      return { ...base, draft, announcement: { value: { kind: 'draft', task: task.id, dates }, nonce: base.announcement.nonce + 1 } }
    }

    case 'DRAG': {
      const task = state.tasks.find((candidate) => candidate.id === event.task)
      if (!task || !editableTask(state, task)) return state
      const edge = task.milestone ? 'move' : event.edge
      const base = state.draft && (state.draft.task !== task.id || state.draft.edge !== edge || state.draft.by !== 'pointer') ? commit(state) : state
      const origin = base.draft?.task === task.id ? base.draft.origin : datesFor(base, task)
      if (base.draft && base.draft.offset === event.offset && base.draft.task === task.id) return base
      return { ...base, draft: { task: task.id, edge, offset: event.offset, origin, by: 'pointer', nonce: (base.draft?.nonce ?? 0) + 1 } }
    }

    case 'COMMIT':
      return commit(state)

    case 'CANCEL': {
      const draft = state.draft
      if (!draft) return state
      return { ...state, draft: null, announcement: { value: { kind: 'cancelled', task: draft.task, dates: draft.origin }, nonce: state.announcement.nonce + 1 } }
    }

    case 'SETTLE': {
      const change = state.pending.find((candidate) => candidate.id === event.change)
      if (!change) return state
      const rest = state.pending.filter((candidate) => candidate !== change)
      if (!event.ok) {
        // That change only goes back; a later one of the same task stands.
        return { ...state, pending: rest, announcement: { value: { kind: 'failed', task: change.task, message: event.message ?? '' }, nonce: state.announcement.nonce + 1 } }
      }
      const task = state.tasks.find((candidate) => candidate.id === change.task)
      // The owner's tasks show it already: the change goes. Not yet: it waits for them.
      const shown = task && task.start === change.to.start && task.end === change.to.end
      return { ...state, pending: shown ? rest : state.pending.map((candidate) => (candidate === change ? { ...change, settled: true } : candidate)) }
    }
    case 'SCALE': {
      if (event.scale === state.scale) return state
      const intent = { value: event.scale, nonce: state.scaleIntent.nonce + 1 }
      return state.scaleControlled ? { ...state, scaleIntent: intent } : { ...state, scale: event.scale, scaleIntent: intent }
    }
    case 'SYNC_SCALE':
      return event.scale === state.scale ? state : { ...state, scale: event.scale }
    case 'SYNC_TASKS':
      return event.tasks === state.tasks ? state : { ...state, tasks: event.tasks as T[], pending: state.pending.filter((change) => !change.settled) }
    case 'SYNC_OPTIONS': {
      const range = event.range === undefined ? state.range : event.range
      const locale = event.locale === undefined ? state.locale : event.locale
      const editable = event.editable === undefined ? state.editable : event.editable
      return range === state.range && locale === state.locale && editable === state.editable ? state : { ...state, range, locale, editable }
    }
  }
}

export interface GanttConfig<T extends GanttTask> {
  id: string
  tasks: T[]
  /** Controlled; `defaultScale` for uncontrolled. Default 'day'. */
  scale?: GanttScale
  defaultScale?: GanttScale
  onScaleChange?: (scale: GanttScale) => void
  /** The days shown. Default: the tasks' own, with room around them. */
  range?: GanttRange | null
  locale?: string
  /** Enter on a task, or a double press on its bar. */
  onOpen?: (task: T) => void
  /**
   * A task was moved or resized: it stands at its new dates at once. Return
   * a promise to say whether it holds — a rejection puts it back and reads
   * out why. Apply it to your tasks when it holds. Without it, bars stay put.
   */
  onChange?: (change: GanttChange<T>) => Promise<unknown> | unknown
  /** Whether bars may change. Default: when there is an `onChange`. */
  editable?: boolean
}

export function initialState<T extends GanttTask>(config: GanttConfig<T>): GanttState<T> {
  const scale = config.scale ?? config.defaultScale ?? 'day'
  return {
    id: config.id,
    tasks: config.tasks,
    scale,
    range: config.range ?? null,
    locale: config.locale,
    focus: { task: null, nonce: 0 },
    openIntent: { value: null, nonce: 0 },
    scaleIntent: { value: scale, nonce: 0 },
    scaleControlled: config.scale !== undefined,
    editable: config.editable ?? config.onChange !== undefined,
    draft: null,
    pending: [],
    changeIntent: { value: null, nonce: 0 },
    announcement: { value: null, nonce: 0 },
  }
}

/** How long the keys must rest before a change made with them is handed over. */
export const NUDGE_SETTLE_MS = 700

export function createGanttMachine<T extends GanttTask>(config: GanttConfig<T>): Machine<GanttState<T>, GanttEvent> {
  const machine = createMachine(initialState(config), reducer as (state: GanttState<T>, event: GanttEvent) => GanttState<T>)
  let rest: ReturnType<typeof setTimeout> | undefined
  // Answers go to the machine with its effects, so what they change is heard too.
  const wrapped: Machine<GanttState<T>, GanttEvent> = withEffects(machine, (previous, next) => {
    // Keys that pause keep their change; a new key starts the wait over.
    if (next.draft !== previous.draft) {
      clearTimeout(rest)
      if (next.draft?.by === 'keyboard') rest = setTimeout(() => wrapped.send({ type: 'COMMIT' }), NUDGE_SETTLE_MS)
    }
    if (next.changeIntent.nonce !== previous.changeIntent.nonce && next.changeIntent.value) {
      const change = next.changeIntent.value
      const task = next.tasks.find((candidate) => candidate.id === change.task)
      if (task) {
        Promise.resolve()
          .then(() => config.onChange?.({ task, from: change.from, to: change.to }))
          .then(
            () => wrapped.send({ type: 'SETTLE', change: change.id, ok: true }),
            (error) => wrapped.send({ type: 'SETTLE', change: change.id, ok: false, message: error instanceof Error ? error.message : String(error ?? '') })
          )
      }
    }
    if (next.scaleIntent.nonce !== previous.scaleIntent.nonce) config.onScaleChange?.(next.scaleIntent.value)
    if (next.openIntent.nonce !== previous.openIntent.nonce && next.openIntent.value) {
      const task = next.tasks.find((candidate) => candidate.id === next.openIntent.value)
      if (task) config.onOpen?.(task)
    }
  })
  return wrapped
}

export interface GanttWords {
  /** The chart's accessible name. */
  label: string
  /** The list column's heading. */
  task: string
  /** The schedule column's name, with its range. */
  schedule: (range: string) => string
  /** A task's schedule in words. */
  describe: (task: GanttTask, dates: string, days: number) => string
  milestone: (date: string) => string
  empty: string
  today: string
  /** How to move a task with the keyboard: the schedule cell's description. */
  instructions: string
  /** Said as a change is made, and when it is kept: "Design the flow: 11 Sept – 19 Sept 2026". */
  changed: (title: string, dates: string) => string
  cancelled: (title: string, dates: string) => string
  failed: (title: string, message: string) => string
  /** A task's dependencies, after its schedule: "after Write the brief". */
  after: (titles: string[]) => string
  /** A task that starts before one it waits for ends. */
  conflict: (titles: string[]) => string
}

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

export function connect<T extends GanttTask, P = Dict>(state: GanttState<T>, send: (event: GanttEvent) => void, normalize: Normalizer<P>, words: Partial<GanttWords> = {}) {
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

  const titleOf = (id: string) => state.tasks.find((task) => task.id === id)?.title ?? id
  const said = state.announcement.value
  const announcement = !said
    ? ''
    : said.kind === 'failed'
      ? w.failed(titleOf(said.task), said.message)
      : (said.kind === 'cancelled' ? w.cancelled : w.changed)(titleOf(said.task), formatRange(said.dates.start, said.dates.end, state.locale))
  const pendingTasks = new Set(state.pending.map((change) => change.task))
  const links = linksOf(state, range)
  const focused = tabStop(state)

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
    const sent = keys[event.key]
    const arrow = event.key === later || event.key === earlier
    if (!sent || event.metaKey || event.ctrlKey || (event.altKey && !arrow)) return
    if (arrow && !state.editable) return
    event.preventDefault()
    // A key comes from the task that has the focus, whatever the chart last heard.
    const own = (event.currentTarget as HTMLElement | null)?.dataset?.task
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
      role: 'grid',
      'aria-label': w.label,
      'aria-rowcount': state.tasks.length + 1,
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
    getRowProps: (task: T, index: number) =>
      normalize({ ...ganttAnatomy.attrs('row'), role: 'row', 'aria-rowindex': index + 2, 'data-task': task.id }),
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
    getBarProps: (task: T) => {
      const dates = datesFor(state, task)
      const start = daysBetween(range.start, dates.start)
      const span = Math.max(1, daysBetween(dates.start, dates.end) + 1)
      return normalize({
        ...ganttAnatomy.attrs(task.milestone ? 'milestone' : 'bar'),
        'aria-hidden': 'true',
        'data-task': task.id,
        'data-editable': state.editable && !task.locked ? '' : undefined,
        'data-drafting': state.draft?.task === task.id ? '' : undefined,
        'data-pending': pendingTasks.has(task.id) ? '' : undefined,
        // Cut at the chart's edges: a bar that runs on past them says so.
        'data-before': start < 0 ? '' : undefined,
        'data-after': start + span > days ? '' : undefined,
        'data-done': task.progress !== undefined && task.progress >= 1 ? '' : undefined,
        style: { '--gg-gantt-start': Math.max(0, start), '--gg-gantt-span': Math.max(0, Math.min(days, start + span) - Math.max(0, start)) },
      })
    },
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
  const bar = cell.querySelector<HTMLElement>('[data-part="bar"], [data-part="milestone"]') ?? cell
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
