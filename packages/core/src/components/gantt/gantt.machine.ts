import { createMachine, withEffects, type Machine } from '../../machine'
import { addDays } from '../../utils/calendar'
import type { Draft, GanttChange, GanttDates, GanttEdge, GanttEvent, GanttGroup, GanttRange, GanttRow, GanttScale, GanttState, GanttTask, PendingChange } from './gantt.types'

/**
 * The rows, top to bottom, in the tasks' order: a group's heading where its
 * first task would be, then — while it is open — all its tasks; a group with
 * no tasks at the end.
 */
export function rowsOf<T extends GanttTask>(state: GanttState<T>): GanttRow<T>[] {
  if (state.groups.length === 0) return state.tasks.map((task) => ({ kind: 'task', id: task.id, task, level: 1, group: null }))
  const members = new Map<string, T[]>(state.groups.map((group) => [group.id, []]))
  for (const task of state.tasks) if (task.group !== undefined) members.get(task.group)?.push(task)
  const rows: GanttRow<T>[] = []
  const placed = new Set<string>()
  const place = (group: GanttGroup) => {
    placed.add(group.id)
    const tasks = members.get(group.id)!
    const open = !state.collapsed.includes(group.id)
    rows.push({ kind: 'group', id: group.id, group, tasks, open, level: 1 })
    if (open) for (const task of tasks) rows.push({ kind: 'task', id: task.id, task, level: 2, group: group.id })
  }
  const byId = new Map(state.groups.map((group) => [group.id, group]))
  for (const task of state.tasks) {
    const group = task.group === undefined ? undefined : byId.get(task.group)
    if (!group) rows.push({ kind: 'task', id: task.id, task, level: 1, group: null })
    else if (!placed.has(group.id)) place(group)
  }
  for (const group of state.groups) if (!placed.has(group.id)) place(group)
  return rows
}

const indexOf = (state: GanttState, id: string | null) => (id === null ? -1 : rowsOf(state).findIndex((row) => row.id === id))

/** The tab stop: the row the keyboard is on while it is shown, or the first. */
export function tabStop(state: GanttState): string | null {
  return indexOf(state, state.focus.task) !== -1 ? state.focus.task : (rowsOf(state)[0]?.id ?? null)
}

/** The group a task is listed under, when there is one. */
export const groupOf = (state: GanttState, task: GanttTask | undefined) =>
  task?.group !== undefined && state.groups.some((group) => group.id === task.group) ? task.group : null

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
  const rows = rowsOf(state)
  const row = rows[Math.max(0, Math.min(rows.length - 1, index))]
  return !row || row.id === state.focus.task ? state : { ...state, focus: { task: row.id, nonce: state.focus.nonce + 1 } }
}

/** The ids shown as closed: the owner's, or a group's own. */
function toggle<T extends GanttTask>(state: GanttState<T>, group: string, open?: boolean): GanttState<T> {
  if (!state.groups.some((candidate) => candidate.id === group)) return state
  const isOpen = !state.collapsed.includes(group)
  const next = open ?? !isOpen
  if (next === isOpen) return state
  const collapsed = next ? state.collapsed.filter((id) => id !== group) : [...state.collapsed, group]
  // A change being made to a task it hides is kept.
  const kept = !next && state.draft && groupOf(state, state.tasks.find((task) => task.id === state.draft!.task)) === group ? commit(state) : state
  const focused = kept.tasks.find((task) => task.id === kept.focus.task)
  // The keyboard was on a task it hides: it goes to the heading.
  const focus = !next && groupOf(kept, focused) === group ? { task: group, nonce: kept.focus.nonce + 1 } : kept.focus
  return {
    ...kept,
    collapsed: kept.collapsedControlled ? kept.collapsed : collapsed,
    collapseIntent: { value: collapsed, nonce: kept.collapseIntent.nonce + 1 },
    focus,
  }
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
      return focusAt(kept, event.edge === 'first' ? 0 : rowsOf(kept).length - 1)
    }
    case 'OPEN': {
      const task = event.task ?? tabStop(state)
      // A group's heading is not opened: it opens, or closes.
      if (task !== null && state.groups.some((group) => group.id === task)) return toggle(state, task)
      const kept = commit(state)
      return task ? { ...kept, openIntent: { value: task, nonce: kept.openIntent.nonce + 1 } } : kept
    }
    case 'TOGGLE':
      return toggle(state, event.group, event.open)
    case 'PARENT': {
      const group = groupOf(state, state.tasks.find((task) => task.id === tabStop(state)))
      return group === null ? state : focusAt(commit(state), indexOf(state, group))
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
    case 'SYNC_GROUPS':
      return event.groups === state.groups ? state : { ...state, groups: event.groups }
    case 'SYNC_COLLAPSED': {
      const same = event.collapsed.length === state.collapsed.length && event.collapsed.every((id) => state.collapsed.includes(id))
      if (same) return state
      // The tab stop stays where the keyboard can find it: on the heading of the group that hid it.
      const focused = state.tasks.find((task) => task.id === state.focus.task)
      const group = groupOf(state, focused)
      const hidden = group !== null && event.collapsed.includes(group)
      return { ...state, collapsed: event.collapsed, focus: hidden ? { ...state.focus, task: group } : state.focus }
    }
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
  onTaskChange?: (change: GanttChange<T>) => Promise<unknown> | unknown
  /** Whether bars may change. Default: when there is an `onTaskChange`. */
  editable?: boolean
  /** Headings to list tasks under; a task names its own in `group`. */
  groups?: GanttGroup[]
  /** The ids of the closed groups. Controlled; `defaultCollapsed` for uncontrolled. */
  collapsed?: string[]
  defaultCollapsed?: string[]
  onCollapsedChange?: (collapsed: string[]) => void
}

export function initialState<T extends GanttTask>(config: GanttConfig<T>): GanttState<T> {
  const scale = config.scale ?? config.defaultScale ?? 'day'
  return {
    id: config.id,
    tasks: config.tasks,
    groups: config.groups ?? [],
    collapsed: config.collapsed ?? config.defaultCollapsed ?? [],
    collapsedControlled: config.collapsed !== undefined,
    collapseIntent: { value: config.collapsed ?? config.defaultCollapsed ?? [], nonce: 0 },
    scale,
    range: config.range ?? null,
    locale: config.locale,
    focus: { task: null, nonce: 0 },
    openIntent: { value: null, nonce: 0 },
    scaleIntent: { value: scale, nonce: 0 },
    scaleControlled: config.scale !== undefined,
    editable: config.editable ?? config.onTaskChange !== undefined,
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
          .then(() => config.onTaskChange?.({ task, from: change.from, to: change.to }))
          .then(
            () => wrapped.send({ type: 'SETTLE', change: change.id, ok: true }),
            (error) => wrapped.send({ type: 'SETTLE', change: change.id, ok: false, message: error instanceof Error ? error.message : String(error ?? '') })
          )
      }
    }
    if (next.scaleIntent.nonce !== previous.scaleIntent.nonce) config.onScaleChange?.(next.scaleIntent.value)
    if (next.collapseIntent.nonce !== previous.collapseIntent.nonce) config.onCollapsedChange?.(next.collapseIntent.value)
    if (next.openIntent.nonce !== previous.openIntent.nonce && next.openIntent.value) {
      const task = next.tasks.find((candidate) => candidate.id === next.openIntent.value)
      if (task) config.onOpen?.(task)
    }
  })
  return wrapped
}
