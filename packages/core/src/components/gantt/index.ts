import { createMachine, withEffects, type Machine } from '../../machine'
import { createAnatomy, type Dict, type Normalizer } from '../../types'
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
}

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
}

export type GanttEvent =
  | { type: 'FOCUS'; task: string }
  | { type: 'WALK'; step: number }
  | { type: 'EDGE'; edge: 'first' | 'last' }
  | { type: 'OPEN'; task?: string }
  | { type: 'SCALE'; scale: GanttScale }
  | { type: 'SYNC_TASKS'; tasks: GanttTask[] }
  | { type: 'SYNC_SCALE'; scale: GanttScale }
  | { type: 'SYNC_OPTIONS'; range?: GanttRange | null; locale?: string }

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
  'milestone',
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

export function reducer<T extends GanttTask>(state: GanttState<T>, event: GanttEvent): GanttState<T> {
  const moveTo = (index: number): GanttState<T> => {
    const task = state.tasks[Math.max(0, Math.min(state.tasks.length - 1, index))]
    return !task || task.id === state.focus.task ? state : { ...state, focus: { task: task.id, nonce: state.focus.nonce + 1 } }
  }
  switch (event.type) {
    case 'FOCUS':
      return event.task === state.focus.task ? state : { ...state, focus: { task: event.task, nonce: state.focus.nonce } }
    case 'WALK': {
      const at = indexOf(state, tabStop(state))
      return moveTo(at + event.step)
    }
    case 'EDGE':
      return moveTo(event.edge === 'first' ? 0 : state.tasks.length - 1)
    case 'OPEN': {
      const task = event.task ?? tabStop(state)
      return task ? { ...state, openIntent: { value: task, nonce: state.openIntent.nonce + 1 } } : state
    }
    case 'SCALE': {
      if (event.scale === state.scale) return state
      const intent = { value: event.scale, nonce: state.scaleIntent.nonce + 1 }
      return state.scaleControlled ? { ...state, scaleIntent: intent } : { ...state, scale: event.scale, scaleIntent: intent }
    }
    case 'SYNC_SCALE':
      return event.scale === state.scale ? state : { ...state, scale: event.scale }
    case 'SYNC_TASKS':
      return event.tasks === state.tasks ? state : { ...state, tasks: event.tasks as T[] }
    case 'SYNC_OPTIONS': {
      const range = event.range === undefined ? state.range : event.range
      const locale = event.locale === undefined ? state.locale : event.locale
      return range === state.range && locale === state.locale ? state : { ...state, range, locale }
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
  }
}

export function createGanttMachine<T extends GanttTask>(config: GanttConfig<T>): Machine<GanttState<T>, GanttEvent> {
  const machine = createMachine(initialState(config), reducer as (state: GanttState<T>, event: GanttEvent) => GanttState<T>)
  return withEffects(machine, (previous, next) => {
    if (next.scaleIntent.nonce !== previous.scaleIntent.nonce) config.onScaleChange?.(next.scaleIntent.value)
    if (next.openIntent.nonce !== previous.openIntent.nonce && next.openIntent.value) {
      const task = next.tasks.find((candidate) => candidate.id === next.openIntent.value)
      if (task) config.onOpen?.(task)
    }
  })
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
}

const idPart = (value: string) => value.replace(/[^\w-]/g, (char) => `_${char.charCodeAt(0).toString(16)}`)

export const ganttIds = (id: string) => ({
  root: id,
  schedule: (task: string) => `${id}-schedule-${idPart(task)}`,
  title: (task: string) => `${id}-title-${idPart(task)}`,
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

  const onKeyDown = (event: KeyboardEvent) => {
    const keys: Record<string, GanttEvent> = {
      ArrowDown: { type: 'WALK', step: 1 },
      ArrowUp: { type: 'WALK', step: -1 },
      PageDown: { type: 'WALK', step: PAGE },
      PageUp: { type: 'WALK', step: -PAGE },
      Home: { type: 'EDGE', edge: 'first' },
      End: { type: 'EDGE', edge: 'last' },
      Enter: { type: 'OPEN' },
    }
    const sent = keys[event.key]
    if (!sent || event.altKey || event.metaKey) return
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
        'data-task': task.id,
        onKeyDown,
        onFocusIn: (event: FocusEvent) => {
          if (event.target === event.currentTarget) send({ type: 'FOCUS', task: task.id })
        },
        onDoubleClick: () => send({ type: 'OPEN', task: task.id }),
      }),
    /** The schedule in words, for a screen reader; the bar shows it to the eye. */
    describe: (task: T) =>
      task.milestone
        ? w.milestone(formatDate(task.start, state.locale))
        : w.describe(task, formatRange(task.start, task.end, state.locale), daysBetween(task.start, task.end) + 1),
    scheduleTextProps: normalize({ ...ganttAnatomy.attrs('schedule-text') }),
    getBarProps: (task: T) => {
      const start = daysBetween(range.start, task.start)
      const span = Math.max(1, daysBetween(task.start, task.end) + 1)
      return normalize({
        ...ganttAnatomy.attrs(task.milestone ? 'milestone' : 'bar'),
        'aria-hidden': 'true',
        'data-task': task.id,
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
