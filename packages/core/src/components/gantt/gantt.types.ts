import type { ISODate } from '../../utils/calendar'

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
  /** The tasks — or groups — that must finish before this one starts: an arrow from each. */
  dependsOn?: string[]
  /** The id of the group it is listed under. */
  group?: string
}

/** A heading tasks are listed under. Its dates are its tasks': it has none of its own. Ids are shared with the tasks', so none may be both. */
export interface GanttGroup {
  id: string
  title: string
}

/** A row of the chart: a task, or a group's heading. Only the rows of open groups' tasks are listed. */
export type GanttRow<T extends GanttTask = GanttTask> =
  | { kind: 'task'; id: string; task: T; level: 1 | 2; group: string | null }
  | { kind: 'group'; id: string; group: GanttGroup; tasks: T[]; open: boolean; level: 1 }

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
export interface Draft {
  task: string
  edge: GanttEdge
  offset: number
  origin: GanttDates
  by: 'keyboard' | 'pointer'
  nonce: number
}

export interface PendingChange {
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
  groups: GanttGroup[]
  /** The ids of the closed groups. */
  collapsed: string[]
  collapsedControlled: boolean
  collapseIntent: { value: string[]; nonce: number }
  scale: GanttScale
  /** Fixed by the owner, or null to fit the tasks. */
  range: GanttRange | null
  locale: string | undefined
  /** The row the keyboard is on: a task's id, or a group's. */
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
  | { type: 'SYNC_GROUPS'; groups: GanttGroup[] }
  | { type: 'SYNC_COLLAPSED'; collapsed: string[] }
  /** Open or close a group; without `open`, the other way. */
  | { type: 'TOGGLE'; group: string; open?: boolean }
  /** From a task to the heading of its group. */
  | { type: 'PARENT' }
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
  /** A group's summary in words: how many tasks, their days, how far along. */
  group: (count: number, dates: string | null, days: number, progress: number | undefined) => string
}
