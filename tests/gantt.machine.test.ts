import { describe, expect, it, vi } from 'vitest'
import { connect, createGanttMachine, datesFor, NUDGE_SETTLE_MS, rangeOf, scaleRows, tabStop } from '../packages/core/src/components/gantt'
import { daysBetween } from '../packages/core/src/utils/calendar'
import { plan, planRange } from './conformance/plan'

/**
 * The Gantt with no DOM: the days a chart shows and how its header is cut,
 * where each bar starts and how long it runs, what a screen reader hears of
 * a task, and the walk.
 */

const same = (props: Record<string, unknown>) => props

describe('gantt', () => {
  it('fits its days to the tasks with room around them, lined up on the scale’s unit', () => {
    expect(rangeOf(plan, 'day', 'en-GB')).toEqual({ start: '2026-09-04', end: '2026-10-12' })
    // Weeks from Monday in Britain, Sunday in the States.
    expect(rangeOf(plan, 'week', 'en-GB')).toEqual({ start: '2026-08-31', end: '2026-10-18' })
    expect(rangeOf(plan, 'week', 'en-US')).toEqual({ start: '2026-08-30', end: '2026-10-17' })
    expect(rangeOf(plan, 'month', 'en-GB')).toEqual({ start: '2026-08-01', end: '2026-10-31' })
    expect(daysBetween('2026-09-18', '2026-09-19')).toBe(1)
  })

  it('cuts its header into months over days, months over weeks, years over months', () => {
    const [months, days] = scaleRows({ start: '2026-09-28', end: '2026-10-04' }, 'day', 'en-GB')
    expect(months.map((cell) => [cell.label, cell.start, cell.span])).toEqual([
      ['September 2026', 0, 3],
      ['October 2026', 3, 4],
    ])
    expect(days.map((cell) => cell.label)).toEqual(['28', '29', '30', '1', '2', '3', '4'])
    expect(days.filter((cell) => cell.weekend).map((cell) => cell.label)).toEqual(['3', '4'])
    expect(days[0].title).toBe('Monday, 28 September 2026')
    const [, weeks] = scaleRows({ start: '2026-08-31', end: '2026-09-20' }, 'week', 'en-GB')
    expect(weeks.map((cell) => [cell.label, cell.span])).toEqual([
      ['31 Aug', 7],
      ['7 Sept', 7],
      ['14 Sept', 7],
    ])
    const [years, monthsOnly] = scaleRows({ start: '2026-11-01', end: '2027-02-28' }, 'month', 'en-GB')
    expect(years.map((cell) => [cell.label, cell.span])).toEqual([
      ['2026', 61],
      ['2027', 59],
    ])
    expect(monthsOnly.map((cell) => cell.label)).toEqual(['Nov', 'Dec', 'Jan', 'Feb'])
  })

  it('places each bar in days from the chart’s start, cut at its edges, and says the schedule in words', () => {
    const machine = createGanttMachine({ id: 'g', tasks: plan, range: planRange, locale: 'en-GB' })
    const api = connect(machine.getState(), machine.send, same)
    expect(api.days).toBe(45)
    expect(api.getBarProps(plan[1])).toMatchObject({ 'data-part': 'bar', style: { '--gg-gantt-start': 9, '--gg-gantt-span': 9 } })
    expect(api.getBarProps(plan[2])).toMatchObject({ 'data-part': 'milestone' })
    expect(api.describe(plan[1])).toBe('10 Sept – 18 Sept 2026, 9 days, 40% done')
    expect(api.describe(plan[2])).toBe('Milestone, 21 Sept 2026')
    const cut = connect({ ...machine.getState(), range: { start: '2026-09-15', end: '2026-09-30' } }, machine.send, same)
    expect(cut.getBarProps(plan[1])).toMatchObject({ 'data-before': '', style: { '--gg-gantt-start': 0, '--gg-gantt-span': 4 } })
    expect(cut.getBarProps(plan[3])).toMatchObject({ 'data-after': '' })
  })

  it('is a grid: a row per task, its title the row’s header, one tab stop on a schedule cell', () => {
    const machine = createGanttMachine({ id: 'g', tasks: plan, range: planRange })
    const api = connect(machine.getState(), machine.send, same, { label: 'Launch plan' })
    expect(api.rootProps).toMatchObject({ role: 'grid', 'aria-label': 'Launch plan', 'aria-rowcount': 5 })
    expect(api.getRowProps(plan[0], 0)).toMatchObject({ role: 'row', 'aria-rowindex': 2 })
    expect(api.getTitleProps(plan[0])).toMatchObject({ role: 'rowheader' })
    const cells = plan.map((task) => api.getScheduleProps(task) as Record<string, unknown>)
    expect(cells.map((cell) => cell.tabIndex)).toEqual([0, -1, -1, -1])
  })

  it('walks the tasks and stops at the ends; Enter opens; a scale change is asked for when controlled', () => {
    const opened: string[] = []
    const scales: string[] = []
    const machine = createGanttMachine({ id: 'g', tasks: plan, scale: 'day', onOpen: (task) => opened.push(task.id), onScaleChange: (scale) => scales.push(scale) })
    machine.send({ type: 'WALK', step: 1 })
    machine.send({ type: 'WALK', step: 10 })
    expect(tabStop(machine.getState())).toBe('build')
    machine.send({ type: 'EDGE', edge: 'first' })
    machine.send({ type: 'OPEN' })
    expect(opened).toEqual(['brief'])
    machine.send({ type: 'SCALE', scale: 'week' })
    expect(scales).toEqual(['week'])
    expect(machine.getState().scale).toBe('day')
  })
})

describe('gantt: moving and resizing', () => {
  const edit = (onChange: (change: { task: { id: string }; from: unknown; to: unknown }) => unknown = () => undefined) => {
    const changes: unknown[] = []
    const machine = createGanttMachine({ id: 'g', tasks: plan, range: planRange, locale: 'en-GB', onChange: (change) => { changes.push([change.task.id, change.from, change.to]); return onChange(change) } })
    return { machine, send: machine.send, changes, said: () => connect(machine.getState(), machine.send, same).announcement }
  }

  it('the keys add up to one change, said at each step, handed over when they rest', async () => {
    vi.useFakeTimers()
    const { send, changes, said, machine } = edit()
    send({ type: 'FOCUS', task: 'design' })
    send({ type: 'NUDGE', edge: 'move', days: 1 })
    send({ type: 'NUDGE', edge: 'move', days: 1 })
    expect(said()).toBe('Design the flow: 12 Sept – 20 Sept 2026')
    expect(datesFor(machine.getState(), plan[1])).toEqual({ start: '2026-09-12', end: '2026-09-20' })
    expect(changes).toEqual([])
    await vi.advanceTimersByTimeAsync(NUDGE_SETTLE_MS + 10)
    expect(changes).toEqual([['design', { start: '2026-09-10', end: '2026-09-18' }, { start: '2026-09-12', end: '2026-09-20' }]])
    vi.useRealTimers()
  })

  it('Alt moves the end, never before the start; Escape puts the change back', () => {
    const { send, said, machine } = edit()
    send({ type: 'FOCUS', task: 'design' })
    send({ type: 'NUDGE', edge: 'end', days: -20 })
    expect(datesFor(machine.getState(), plan[1])).toEqual({ start: '2026-09-10', end: '2026-09-10' })
    send({ type: 'CANCEL' })
    expect(datesFor(machine.getState(), plan[1])).toEqual({ start: '2026-09-10', end: '2026-09-18' })
    expect(said()).toBe('Design the flow put back: 10 Sept – 18 Sept 2026')
  })

  it('a drag sets the offset from where it began; its start never passes its end; walking away keeps a change', () => {
    const { send, changes, machine } = edit()
    send({ type: 'DRAG', task: 'build', edge: 'start', offset: 3 })
    send({ type: 'DRAG', task: 'build', edge: 'start', offset: 40 })
    expect(datesFor(machine.getState(), plan[3])).toEqual({ start: '2026-10-09', end: '2026-10-09' })
    send({ type: 'DRAG', task: 'build', edge: 'start', offset: 2 })
    send({ type: 'COMMIT' })
    expect(changes).toHaveLength(0) // handed over in a moment, by the effect
    send({ type: 'FOCUS', task: 'design' })
    send({ type: 'NUDGE', edge: 'move', days: 7 })
    send({ type: 'WALK', step: 1 })
    expect(machine.getState().draft).toBeNull()
    expect(machine.getState().pending.map((change) => change.task)).toEqual(['build', 'design'])
  })

  it('a refused change goes back and says why; one that holds waits for the owner’s tasks', async () => {
    const answers: ((ok: boolean) => void)[] = []
    const { send, said, machine } = edit(() => new Promise((resolve, reject) => answers.push((ok) => (ok ? resolve(undefined) : reject(new Error('the client has not signed'))))))
    send({ type: 'DRAG', task: 'design', edge: 'move', offset: 5 })
    send({ type: 'COMMIT' })
    send({ type: 'DRAG', task: 'build', edge: 'end', offset: 3 })
    send({ type: 'COMMIT' })
    await new Promise((resolve) => setTimeout(resolve, 0))
    answers[0](false)
    answers[1](true)
    await new Promise((resolve) => setTimeout(resolve, 0))
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(datesFor(machine.getState(), plan[1])).toEqual({ start: '2026-09-10', end: '2026-09-18' })
    // A change that holds was said when it was made; the refusal is the last word.
    expect(said()).toBe('Design the flow was not changed: the client has not signed')
    expect(datesFor(machine.getState(), plan[3]).end).toBe('2026-10-12')
    send({ type: 'SYNC_TASKS', tasks: plan.map((task) => (task.id === 'build' ? { ...task, end: '2026-10-12' } : task)) })
    expect(machine.getState().pending).toEqual([])
  })

  it('a milestone only moves; a locked task and a chart without onChange do not change', () => {
    const { send, machine } = edit()
    send({ type: 'DRAG', task: 'review', edge: 'end', offset: 2 })
    expect(datesFor(machine.getState(), plan[2])).toEqual({ start: '2026-09-23', end: '2026-09-23' })
    const locked = createGanttMachine({ id: 'g', tasks: [{ ...plan[0], locked: true }], onChange: () => undefined })
    locked.send({ type: 'DRAG', task: 'brief', edge: 'move', offset: 2 })
    expect(locked.getState().draft).toBeNull()
    const still = createGanttMachine({ id: 'g', tasks: plan })
    still.send({ type: 'NUDGE', edge: 'move', days: 1 })
    expect(still.getState().draft).toBeNull()
    expect(connect(still.getState(), still.send, same).getBarProps(plan[0])).toMatchObject({ 'data-editable': undefined })
  })
})
