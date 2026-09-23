import { createMachine, withEffects, type Machine } from '../../machine'
import { edgeEnabled, nearestEnabled, nextEnabled } from '../../utils/collection'
import type { QueueEvent, QueueState, TaskItem } from './task.types'

// A queue wraps, as a listbox does, and never lands on a disabled row.
const walk = { loop: true, isDisabled: (task: TaskItem) => !!task.disabled }

const indexOf = (tasks: TaskItem[], value: string | null) => (value == null ? -1 : tasks.findIndex((task) => task.value === value))
const selectable = (tasks: TaskItem[], value: string | null) => {
  const task = tasks[indexOf(tasks, value)]
  return !!task && !task.disabled
}

/** Choose `value`: always heard as intent, moved only when uncontrolled. */
function commit(state: QueueState, value: string | null): QueueState {
  const next = { ...state, intent: { value, nonce: state.intent.nonce + 1 } }
  return state.controlled ? next : { ...next, value }
}

/** The arrows carry the selection with them: a queue drives a detail pane beside it. */
function moveFocus(state: QueueState, index: number): QueueState {
  const target = state.tasks[index]
  if (!target) return state
  const moved = { ...state, focus: { value: target.value, nonce: state.focus.nonce + 1 } }
  return target.value === state.value ? moved : commit(moved, target.value)
}

export function reducer(state: QueueState, event: QueueEvent): QueueState {
  switch (event.type) {
    case 'SELECT': {
      if (!selectable(state.tasks, event.value)) return state
      const focused = event.value === state.focus.value ? state : { ...state, focus: { value: event.value, nonce: state.focus.nonce } }
      return event.value === state.value ? focused : commit(focused, event.value)
    }

    case 'FOCUS':
      if (event.value === state.focus.value || indexOf(state.tasks, event.value) === -1) return state
      return { ...state, focus: { value: event.value, nonce: state.focus.nonce } }

    case 'MOVE': {
      const from = indexOf(state.tasks, state.focus.value ?? state.value)
      const next = nextEnabled(state.tasks, from, event.step, walk)
      return next === -1 || next === from ? state : moveFocus(state, next)
    }

    case 'EDGE': {
      const next = edgeEnabled(state.tasks, event.edge, walk)
      return next === -1 || state.tasks[next].value === state.focus.value ? state : moveFocus(state, next)
    }

    case 'SYNC_VALUE': {
      if (event.value === state.value) return state
      return { ...state, value: event.value, focus: { value: event.value, nonce: state.focus.nonce } }
    }

    case 'SYNC_TASKS': {
      if (event.tasks === state.tasks) return state
      const before = new Map(state.tasks.map((task) => [task.value, task.state ?? 'queued']))
      // Several phases may turn over between two batches. The live region gets
      // the last of them in list order: six sentences at once are not heard,
      // and the rows themselves carry the rest.
      let changed = state.changed
      for (const task of event.tasks) {
        const was = before.get(task.value)
        const now = task.state ?? 'queued'
        if (was !== undefined && was !== now) changed = { value: task.value, state: now, nonce: state.changed.nonce + 1 }
      }

      let next: QueueState = { ...state, tasks: event.tasks, changed }
      // The chosen task went away: its neighbour takes its place, and the
      // owner hears it — a detail pane beside the queue is showing something.
      if (state.value !== null && !selectable(event.tasks, state.value)) {
        const old = Math.max(0, indexOf(state.tasks, state.value))
        next = commit(next, event.tasks[nearestEnabled(event.tasks, old, walk)]?.value ?? null)
      }
      if (indexOf(event.tasks, next.focus.value) === -1) {
        next = { ...next, focus: { value: next.value, nonce: next.focus.nonce } }
      }
      return next
    }
  }
}

export interface QueueMachineConfig {
  id: string
  tasks?: TaskItem[]
  /** Pass `value` for controlled mode, `defaultValue` for uncontrolled. Default: nothing chosen. */
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string | null) => void
}

export function initialState(config: QueueMachineConfig): QueueState {
  const tasks = config.tasks ?? []
  const controlled = config.value !== undefined
  const wanted = controlled ? config.value ?? null : config.defaultValue ?? null
  // Nothing is chosen for the user: a queue of a hundred rows that opens with
  // one selected has answered a question nobody asked.
  const value = controlled || selectable(tasks, wanted) ? wanted : null
  return {
    id: config.id,
    tasks,
    value,
    controlled,
    // nonce 0: never asked to move focus, and nothing has changed phase.
    focus: { value, nonce: 0 },
    intent: { value, nonce: 0 },
    changed: { value: '', state: 'queued', nonce: 0 },
  }
}

export function createQueueMachine(config: QueueMachineConfig): Machine<QueueState, QueueEvent> {
  const machine = createMachine(initialState(config), reducer)
  return withEffects(machine, (previous, next) => {
    if (next.intent.nonce !== previous.intent.nonce) config.onValueChange?.(next.intent.value)
  })
}
