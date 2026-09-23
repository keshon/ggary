import { describe, expect, it, vi } from 'vitest'
import {
  connect,
  createQueueMachine,
  initialState,
  reducer,
  TASK_TONES,
  type QueueEvent,
  type QueueState,
  type TaskItem,
} from '../packages/core/src/components/task'

const same = <T,>(props: T) => props

const tasks: TaskItem[] = [
  { value: 'heightmap', title: 'Parsing the heightmap', detail: 'terrain/heightmap.ts', meta: '2.1 s', state: 'done' },
  { value: 'biomes', title: 'Generating the biomes', detail: 'world/biomes.ts', meta: '8.4 s', state: 'done' },
  { value: 'resources', title: 'Placing the resources', detail: 'the third pass is going', meta: '14.0 s', state: 'running' },
  { value: 'paths', title: 'Validating the paths', meta: '1.2 s', state: 'failed', disabled: true },
  { value: 'navmesh', title: 'Baking the navmesh', detail: 'waiting for the validation', state: 'queued' },
]

const run = (state: QueueState, ...events: QueueEvent[]) => events.reduce(reducer, state)
const base = initialState({ id: 'q', tasks })
const api = (state: QueueState, send: (event: QueueEvent) => void = () => {}) =>
  connect(state, send, same, { label: 'The queue of agents' })

describe('queue machine — selection', () => {
  it('chooses nothing of its own: a hundred rows with one selected answer a question nobody asked', () => {
    expect(base.value).toBeNull()
    expect(initialState({ id: 'q', tasks, defaultValue: 'biomes' }).value).toBe('biomes')
    // A row that cannot be chosen is not chosen for the user either.
    expect(initialState({ id: 'q', tasks, defaultValue: 'paths' }).value).toBeNull()
  })

  it('chooses on a press; a disabled row and the chosen row change nothing', () => {
    expect(run(base, { type: 'SELECT', value: 'biomes' }).value).toBe('biomes')
    expect(run(base, { type: 'SELECT', value: 'paths' })).toBe(base)
    const chosen = run(base, { type: 'SELECT', value: 'biomes' })
    expect(run(chosen, { type: 'SELECT', value: 'biomes' })).toBe(chosen)
  })

  it('the arrows carry the selection with them, skip what is disabled, and wrap', () => {
    const first = run(base, { type: 'MOVE', step: 1 })
    expect(first).toMatchObject({ value: 'heightmap', focus: { value: 'heightmap', nonce: 1 } })
    const third = run(first, { type: 'MOVE', step: 1 }, { type: 'MOVE', step: 1 })
    expect(third.value).toBe('resources')
    // 'paths' is disabled: the arrow steps over it.
    expect(run(third, { type: 'MOVE', step: 1 }).value).toBe('navmesh')
    expect(run(third, { type: 'MOVE', step: 1 }, { type: 'MOVE', step: 1 }).value).toBe('heightmap')
    expect(run(base, { type: 'EDGE', edge: 'last' }).value).toBe('navmesh')
    expect(run(base, { type: 'EDGE', edge: 'first' }).value).toBe('heightmap')
  })

  it('focus arriving on a row moves the tab stop without moving focus', () => {
    const focused = run(base, { type: 'FOCUS', value: 'resources' })
    expect(focused.focus).toEqual({ value: 'resources', nonce: 0 })
    expect(focused.value).toBeNull()
  })

  it('controlled: the owner is told, and the queue does not move on its own', () => {
    const controlled = initialState({ id: 'q', tasks, value: 'biomes' })
    const moved = run(controlled, { type: 'SELECT', value: 'navmesh' })
    expect(moved.value).toBe('biomes')
    expect(moved.intent).toEqual({ value: 'navmesh', nonce: 1 })
    expect(run(moved, { type: 'SYNC_VALUE', value: 'navmesh' }).value).toBe('navmesh')
  })

  it('tells the owner what was chosen, once per choice', () => {
    const onValueChange = vi.fn()
    const machine = createQueueMachine({ id: 'q', tasks, onValueChange })
    machine.send({ type: 'SELECT', value: 'biomes' })
    machine.send({ type: 'SELECT', value: 'biomes' })
    machine.send({ type: 'MOVE', step: 1 })
    expect(onValueChange.mock.calls).toEqual([['biomes'], ['resources']])
  })
})

describe('queue machine — the work moving underneath', () => {
  it('a phase that turns over is reported once, and the rest is left to the rows', () => {
    const next = tasks.map((task) => (task.value === 'resources' ? { ...task, state: 'done' as const } : task))
    const moved = run(base, { type: 'SYNC_TASKS', tasks: next })
    expect(moved.changed).toEqual({ value: 'resources', state: 'done', nonce: 1 })
    expect(api(moved).announcement).toBe('Placing the resources: done')
    // Nothing changed: nothing is said, and the same array is not re-read.
    expect(run(moved, { type: 'SYNC_TASKS', tasks: next })).toBe(moved)
    expect(api(base).announcement).toBeNull()
  })

  it('several at once collapse into the latest: six sentences at a time are not heard', () => {
    const next = tasks.map((task) =>
      task.value === 'resources' ? { ...task, state: 'done' as const } : task.value === 'navmesh' ? { ...task, state: 'running' as const } : task
    )
    const moved = run(base, { type: 'SYNC_TASKS', tasks: next })
    expect(api(moved).announcement).toBe('Baking the navmesh: running')
  })

  it('a task that arrives is not a phase that changed', () => {
    const next = [...tasks, { value: 'export', title: 'Exporting the preview', state: 'running' as const }]
    expect(run(base, { type: 'SYNC_TASKS', tasks: next }).changed.nonce).toBe(0)
  })

  it('the chosen task goes away: its neighbour takes its place, and the owner hears it', () => {
    const chosen = run(base, { type: 'SELECT', value: 'biomes' })
    const next = tasks.filter((task) => task.value !== 'biomes')
    const moved = run(chosen, { type: 'SYNC_TASKS', tasks: next })
    expect(moved.value).toBe('resources')
    expect(moved.intent.nonce).toBe(2)
  })
})

describe('queue connect', () => {
  it('is a listbox of options: without the roles aria-selected is invalid', () => {
    const state = run(base, { type: 'SELECT', value: 'biomes' })
    const connected = api(state)
    expect(connected.rootProps).toMatchObject({
      'data-scope': 'queue',
      'data-part': 'root',
      role: 'listbox',
      'aria-label': 'The queue of agents',
      id: 'q',
    })
    const row = connected.getTaskProps(tasks[1])
    expect(row).toMatchObject({ role: 'option', 'aria-selected': 'true', 'data-value': 'biomes', id: 'q-task-biomes' })
    expect(connected.getTaskProps(tasks[0])['aria-selected']).toBe('false')
  })

  it('one tab stop for the whole queue, on the row the keys are on', () => {
    // Nothing chosen: the stop is the first row, so Tab enters the list once.
    expect(api(base).getTaskProps(tasks[0]).tabIndex).toBe(0)
    expect(api(base).getTaskProps(tasks[2]).tabIndex).toBe(-1)
    const moved = run(base, { type: 'SELECT', value: 'resources' })
    expect(api(moved).getTaskProps(tasks[2]).tabIndex).toBe(0)
    expect(api(moved).getTaskProps(tasks[0]).tabIndex).toBe(-1)
  })

  it('the phase paints the row and is spoken with it', () => {
    const connected = api(base)
    expect(connected.getTaskProps(tasks[2])).toMatchObject({
      'data-state': 'running',
      'data-tone': 'running',
      'aria-label': 'Placing the resources, running, the third pass is going, 14.0 s',
    })
    expect(connected.getTaskProps(tasks[3])).toMatchObject({
      'data-state': 'failed',
      'data-tone': 'error',
      'aria-disabled': 'true',
      'aria-label': 'Validating the paths, failed, 1.2 s',
    })
    // A task that waits has a phase and no tone: there is no outcome yet.
    expect(connected.getTaskProps(tasks[4])['data-tone']).toBeUndefined()
    expect(connected.getTaskProps({ value: 'x', title: 'X' })['data-state']).toBe('queued')
  })

  it('every phase borrows its colour from the kit’s five tones, and no sixth', () => {
    expect(TASK_TONES).toEqual({
      queued: undefined,
      running: 'running',
      done: 'ok',
      warn: 'warn',
      failed: 'error',
      skipped: 'neutral',
    })
  })

  it('takes words of its own, for the rows and for what is said aloud', () => {
    const changed = run(base, { type: 'SYNC_TASKS', tasks: tasks.map((task) => (task.value === 'navmesh' ? { ...task, state: 'failed' as const } : task)) })
    const connected = connect(changed, () => {}, same, {
      words: { state: { failed: 'сорвалась' }, changed: (title, state) => `${title} — ${state}` },
    })
    expect(connected.announcement).toBe('Baking the navmesh — сорвалась')
    expect(connected.getTaskProps(tasks[2])['aria-label']).toContain('running')
  })

  it('the mark in the gutter is the kit’s own dot, reading the tone off the row', () => {
    const connected = api(base)
    expect(connected.getDotProps()).toEqual({ 'data-scope': 'dot', 'data-part': 'root', 'aria-hidden': 'true' })
    expect(connected.getGutterProps()).toMatchObject({ 'data-scope': 'task', 'data-part': 'gutter' })
    expect(connected.getTitleProps(tasks[0])).toMatchObject({ 'data-part': 'title', title: 'Parsing the heightmap' })
  })

  it('the live region stands outside the list, and is polite', () => {
    expect(api(base).statusProps).toEqual({
      'data-scope': 'queue',
      'data-part': 'status',
      id: 'q-status',
      role: 'status',
      'aria-live': 'polite',
    })
  })

  it('the arrows are answered on the row, and the page does not scroll under them', () => {
    const events: QueueEvent[] = []
    const connected = api(base, (event) => events.push(event))
    const row = connected.getTaskProps(tasks[0]) as unknown as { onKeyDown: (event: KeyboardEvent) => void }
    const press = (key: string) => {
      const prevented: string[] = []
      row.onKeyDown({ key, preventDefault: () => prevented.push(key) } as unknown as KeyboardEvent)
      return prevented
    }
    expect(press('ArrowDown')).toEqual(['ArrowDown'])
    expect(press('ArrowUp')).toEqual(['ArrowUp'])
    expect(press('Home')).toEqual(['Home'])
    expect(press('End')).toEqual(['End'])
    // A letter belongs to the page, not to the queue.
    expect(press('a')).toEqual([])
    expect(events).toEqual([
      { type: 'MOVE', step: 1 },
      { type: 'MOVE', step: -1 },
      { type: 'EDGE', edge: 'first' },
      { type: 'EDGE', edge: 'last' },
    ])
  })
})
