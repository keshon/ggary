import type { StatusTone } from '../../utils/tone'

/**
 * The phase of one task. Six, because a queue of agents distinguishes two
 * things the kit's five tones do not: a task that is WAITING and one that was
 * SKIPPED. Both are the neutral colour; what differs is what happened, and a
 * row says that in words as well as in a tone.
 */
export type TaskState = 'queued' | 'running' | 'done' | 'warn' | 'failed' | 'skipped'

/**
 * The phase's colour comes through the kit's one tone vocabulary, never
 * through a colour of its own: a queue row, a badge and a dot on the same
 * screen then cannot disagree about what "failed" looks like.
 */
export const TASK_TONES: Record<TaskState, StatusTone | undefined> = {
  queued: undefined,
  running: 'running',
  done: 'ok',
  warn: 'warn',
  failed: 'error',
  skipped: 'neutral',
}

export interface TaskItem {
  /** What the queue calls this task back with. */
  value: string
  /** The name of the task. Truncated when the row is narrow; the full text stays in the DOM. */
  title: string
  /** What exactly is being done: a file, a count, a pass. */
  detail?: string
  /** A time or a counter, pushed to the end of the row. */
  meta?: string
  /** Default `queued`: the task waits. */
  state?: TaskState
  /** Stays visible and in the arrow traversal, but cannot be chosen. */
  disabled?: boolean
}

/** The fixed text of a row's name and of the live region. */
export interface QueueWords {
  /** The phase in words. A `data-state` paints the row; it is not spoken. */
  state: Record<TaskState, string>
  /** A row's name: what it is, how it is going, and what stands beside it. */
  row(title: string, state: string, detail: string | undefined, meta: string | undefined): string
  /** What the live region says when a task's phase changes while the queue is watched. */
  changed(title: string, state: string): string
}

/** What a caller may replace: any of the words, and any one phase on its own. */
export type QueueWordsInput = Partial<Omit<QueueWords, 'state'>> & { state?: Partial<Record<TaskState, string>> }

/** A phase change, for the live region. The words are the connect's. */
export interface TaskChange {
  value: string
  state: TaskState
  nonce: number
}

export interface QueueState {
  id: string
  tasks: TaskItem[]
  /** The chosen task. Null until one is chosen: a queue claims no selection of its own. */
  value: string | null
  controlled: boolean
  /**
   * The roving tab stop. `nonce` changes only when focus should MOVE there —
   * an arrow, `Home`, `End` — so a re-render never drags focus into the queue
   * from elsewhere.
   */
  focus: { value: string | null; nonce: number }
  /** The selection the user asked for; `onValueChange` fires on it. */
  intent: { value: string | null; nonce: number }
  /** The latest phase change among the tasks. Nonce 0: nothing has changed yet. */
  changed: TaskChange
}

export type QueueEvent =
  | { type: 'SELECT'; value: string }
  /** Real focus arrived on a row: the tab stop follows, without moving focus. */
  | { type: 'FOCUS'; value: string }
  | { type: 'MOVE'; step: number }
  | { type: 'EDGE'; edge: 'first' | 'last' }
  | { type: 'SYNC_TASKS'; tasks: TaskItem[] }
  | { type: 'SYNC_VALUE'; value: string | null }
