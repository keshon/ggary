import { describe, expect, it, vi } from 'vitest'
import { connect, createGanttMachine, datesFor, linksOf, NUDGE_SETTLE_MS, rangeOf, scaleRows, tabStop, type GanttGroup, type GanttLink, type GanttScale, type GanttTask } from '../packages/core/src/components/gantt'
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
    expect(api.getRowProps(plan[0])).toMatchObject({ role: 'row', 'aria-rowindex': 2 })
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
  const edit = (onTaskChange: (change: { task: { id: string }; from: unknown; to: unknown }) => unknown = () => undefined) => {
    const changes: unknown[] = []
    const machine = createGanttMachine({ id: 'g', tasks: plan, range: planRange, locale: 'en-GB', onTaskChange: (change) => { changes.push([change.task.id, change.from, change.to]); return onTaskChange(change) } })
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

  it('a milestone only moves; a locked task and a chart without onTaskChange do not change', () => {
    const { send, machine } = edit()
    send({ type: 'DRAG', task: 'review', edge: 'end', offset: 2 })
    expect(datesFor(machine.getState(), plan[2])).toEqual({ start: '2026-09-23', end: '2026-09-23' })
    const locked = createGanttMachine({ id: 'g', tasks: [{ ...plan[0], locked: true }], onTaskChange: () => undefined })
    locked.send({ type: 'DRAG', task: 'brief', edge: 'move', offset: 2 })
    expect(locked.getState().draft).toBeNull()
    const still = createGanttMachine({ id: 'g', tasks: plan })
    still.send({ type: 'NUDGE', edge: 'move', days: 1 })
    expect(still.getState().draft).toBeNull()
    expect(connect(still.getState(), still.send, same).getBarProps(plan[0])).toMatchObject({ 'data-editable': undefined })
  })
})

describe('gantt: dependencies', () => {
  const chained: GanttTask[] = [
    plan[0],
    { ...plan[1], dependsOn: ['brief'] },
    { ...plan[2], dependsOn: ['design'] },
    { ...plan[3], dependsOn: ['review', 'missing', 'build'] },
  ]
  const state = (tasks: GanttTask[], scale: GanttScale = 'day') => createGanttMachine({ id: 'g', tasks, range: planRange, locale: 'en-GB', scale }).getState()
  const corners = (link: GanttLink) => link.points.map((point) => [point.x, point.gap, point.y])

  it('an arrow from the end of each task waited for to the start of the one waiting; a missing task or itself is no arrow', () => {
    const links = linksOf(state(chained), planRange)
    expect(links.map((link) => [link.from, link.to, link.conflict])).toEqual([
      ['brief', 'design', false],
      ['design', 'review', false],
      ['review', 'build', false],
    ])
    // No room between them: out a gap, down to the rows' seam, back to a gap before the start, down, in.
    expect(corners(links[0])).toEqual([[9, 0, 0.5], [9, 1, 0.5], [9, 1, 1], [9, -1, 1], [9, -1, 1.5], [9, 0, 1.5]])
    // Room: across, down, in — to the milestone's tip, a gap short of its middle.
    expect(corners(links[1])).toEqual([[18, 0, 1.5], [20.5, -2, 1.5], [20.5, -2, 2.5], [20.5, -1, 2.5]])
    // Out of a milestone at its other tip.
    expect(corners(links[2])).toEqual([[20.5, 1, 2.5], [20.5, 2, 2.5], [20.5, 2, 3], [20, -1, 3], [20, -1, 3.5], [20, 0, 3.5]])
  })

  it('the room a straight run needs grows with the scale; an arrow up the chart runs along the seam under the task', () => {
    expect(linksOf(state(chained, 'week'), planRange)[1].points).toHaveLength(4)
    expect(linksOf(state(chained, 'month'), planRange)[1].points).toHaveLength(6)
    const upward = linksOf(state([{ ...plan[0], dependsOn: ['design'] }, plan[1]]), planRange)[0]
    expect(upward.points[2].y).toBe(1)
    expect(upward.conflict).toBe(true)
  })

  it('a conflict: a bar starting on or before the last day of one it waits for; a milestone is a moment, so a task may start on its day', () => {
    const conflicts = (tasks: GanttTask[]) => linksOf(state(tasks), planRange).map((link) => link.conflict)
    expect(conflicts([plan[0], { ...plan[1], start: '2026-09-09', dependsOn: ['brief'] }])).toEqual([true])
    expect(conflicts([plan[0], { ...plan[2], start: '2026-09-09', end: '2026-09-09', dependsOn: ['brief'] }])).toEqual([false])
    expect(conflicts([plan[0], { ...plan[2], start: '2026-09-08', end: '2026-09-08', dependsOn: ['brief'] }])).toEqual([true])
    expect(conflicts([plan[2], { ...plan[3], start: '2026-09-20', dependsOn: ['review'] }])).toEqual([true])
  })

  it('says what a task waits for, and which it starts too early for; its arrows stand out while it has the keyboard; a change moves them', () => {
    const machine = createGanttMachine({ id: 'g', tasks: [plan[0], { ...plan[1], start: '2026-09-09', dependsOn: ['brief'] }], range: planRange, locale: 'en-GB', onTaskChange: () => undefined })
    const api = () => connect(machine.getState(), machine.send, same)
    expect(api().describe(machine.getState().tasks[1])).toBe('9 Sept – 18 Sept 2026, 10 days, 40% done, after Write the brief; starts before Write the brief ends')
    expect(api().linksProps).toMatchObject({ 'aria-hidden': 'true' })
    const [link] = api().links
    expect(api().getLinkProps(link)).toMatchObject({ 'data-from': 'brief', 'data-to': 'design', 'data-conflict': '', 'data-active': undefined })
    machine.send({ type: 'FOCUS', task: 'design' })
    expect(api().getLinkProps(api().links[0])).toMatchObject({ 'data-active': '' })
    machine.send({ type: 'NUDGE', edge: 'move', days: 1 })
    expect(api().links[0].conflict).toBe(false)
    expect(api().describe(machine.getState().tasks[1])).toBe('10 Sept – 19 Sept 2026, 10 days, 40% done, after Write the brief')
    const segments = api().segmentsOf(api().links[0])
    expect(segments).toHaveLength(5)
    expect(api().getSegmentProps(segments[0])).toMatchObject({ 'data-axis': 'x', style: { '--gg-gantt-x1': 9, '--gg-gantt-x2-gap': 1, '--gg-gantt-y1': 0.5 } })
    expect(api().getSegmentProps(segments[1])).toMatchObject({ 'data-axis': 'y' })
  })
})

describe('gantt: groups', () => {
  const groups: GanttGroup[] = [
    { id: 'discovery', title: 'Discovery' },
    { id: 'delivery', title: 'Delivery' },
    { id: 'empty', title: 'Later' },
  ]
  const tasks: GanttTask[] = [
    { ...plan[0], group: 'discovery' },
    { ...plan[1], group: 'discovery', dependsOn: ['brief'] },
    { ...plan[2], dependsOn: ['discovery'] },
    { ...plan[3], group: 'delivery', dependsOn: ['review'] },
    { id: 'qa', title: 'Test the import', start: '2026-10-05', end: '2026-10-12', group: 'delivery', dependsOn: ['build'] },
  ]
  const make = (config: Partial<Parameters<typeof createGanttMachine>[0]> = {}) => {
    const collapses: string[][] = []
    const machine = createGanttMachine({ id: 'g', tasks, groups, range: planRange, locale: 'en-GB', onCollapsedChange: (next) => void collapses.push(next), ...config })
    const api = () => connect(machine.getState(), machine.send, same)
    const ids = () => api().rows.map((row) => (row.kind === 'group' ? `[${row.id}]` : row.id))
    return { machine, send: machine.send, api, ids, collapses }
  }

  it('lists the rows in the tasks’ order, a group’s heading where its first task is and all its tasks under it; a treegrid with levels', () => {
    const { api, ids } = make({ tasks: [tasks[0], tasks[2], tasks[3], tasks[1], tasks[4]] })
    expect(ids()).toEqual(['[discovery]', 'brief', 'design', 'review', '[delivery]', 'build', 'qa', '[empty]'])
    expect(api().rootProps).toMatchObject({ role: 'treegrid', 'aria-rowcount': 9 })
    expect(api().getGroupRowProps(groups[0])).toMatchObject({ role: 'row', 'aria-rowindex': 2, 'aria-level': 1, 'aria-expanded': 'true' })
    expect(api().getRowProps(tasks[0])).toMatchObject({ 'aria-rowindex': 3, 'aria-level': 2, 'data-level': 2 })
    expect(api().getRowProps(tasks[2])).toMatchObject({ 'aria-level': 1 })
    // Without groups, a grid as before: no levels.
    const plain = createGanttMachine({ id: 'g', tasks: plan })
    expect(connect(plain.getState(), plain.send, same).getRowProps(plan[0])).toMatchObject({ 'aria-level': undefined })
  })

  it('a group’s summary runs from its first task’s start to its last one’s end, each task weighed by its days, and follows a change', () => {
    const { api, send } = make({ onTaskChange: () => undefined, tasks: tasks.map((task) => (task.id === 'qa' ? { ...task, progress: 0.5 } : task)) })
    expect(api().getSummaryProps(groups[1])).toMatchObject({ style: { '--gg-gantt-start': 20, '--gg-gantt-span': 22 } })
    // 19 days at none, 8 at half.
    expect(api().describeGroup(groups[1])).toBe('2 tasks, 21 Sept – 12 Oct 2026, 22 days, 15% done')
    // 3 days done, 9 at 40%: 6.6 of 12.
    expect(api().describeGroup(groups[0])).toBe('2 tasks, 7 Sept – 18 Sept 2026, 12 days, 55% done')
    expect(api().getSummaryProps(groups[2])).toBeNull()
    expect(api().describeGroup(groups[2])).toBe('No tasks')
    send({ type: 'DRAG', task: 'qa', edge: 'end', offset: 2 })
    expect(api().getSummaryProps(groups[1])).toMatchObject({ style: { '--gg-gantt-span': 24 } })
  })

  it('closes and opens: its tasks go from the rows and the walk; the owner hears it; controlled, it waits to be told', () => {
    const { api, ids, send, collapses } = make()
    send({ type: 'TOGGLE', group: 'discovery' })
    expect(ids()).toEqual(['[discovery]', 'review', '[delivery]', 'build', 'qa', '[empty]'])
    expect(api().getGroupToggleProps(groups[0])).toMatchObject({ 'data-state': 'closed', 'data-icon': 'chevron-right' })
    expect(collapses).toEqual([['discovery']])
    send({ type: 'FOCUS', task: 'discovery' })
    send({ type: 'WALK', step: 1 })
    expect(api().focusTask).toBe('review') // not its hidden brief
    send({ type: 'TOGGLE', group: 'discovery', open: true })
    expect(collapses).toEqual([['discovery'], []])
    const controlled = make({ collapsed: [] })
    controlled.send({ type: 'TOGGLE', group: 'delivery' })
    expect(controlled.collapses).toEqual([['delivery']])
    expect(controlled.ids()).toContain('build')
    controlled.send({ type: 'SYNC_COLLAPSED', collapsed: ['delivery'] })
    expect(controlled.ids()).not.toContain('build')
  })

  it('closing the group the keyboard is in takes the keyboard to its heading, and keeps a change being made', () => {
    const changes: string[] = []
    const { api, send, machine } = make({ onTaskChange: (change) => void changes.push(change.task.id) })
    send({ type: 'FOCUS', task: 'design' })
    send({ type: 'NUDGE', edge: 'move', days: 1 })
    send({ type: 'TOGGLE', group: 'discovery' })
    expect(api().focusTask).toBe('discovery')
    expect(machine.getState().draft).toBeNull()
    expect(machine.getState().pending.map((change) => change.task)).toEqual(['design'])
    // Told from outside, the tab stop goes there too — without taking the page's focus.
    const other = make({ collapsed: [] })
    other.send({ type: 'FOCUS', task: 'qa' })
    const nonce = other.api().focusNonce
    other.send({ type: 'SYNC_COLLAPSED', collapsed: ['delivery'] })
    expect([other.api().focusTask, other.api().focusNonce]).toEqual(['delivery', nonce])
  })

  it('on a heading, Right opens, Left closes, Enter does either and opens nothing; Left from a task goes up when bars stay put', () => {
    const opened: string[] = []
    const { api, ids } = make({ onOpen: (task) => void opened.push(task.id) })
    const key = (target: string, key: string) => {
      const group = groups.find((candidate) => candidate.id === target)
      const props = (group ? api().getGroupScheduleProps(group) : api().getScheduleProps(tasks.find((task) => task.id === target)!)) as unknown as { onKeyDown: (event: unknown) => void }
      props.onKeyDown({ key, shiftKey: false, altKey: false, metaKey: false, ctrlKey: false, preventDefault() {}, currentTarget: { dataset: { task: target }, closest: () => null } })
    }
    key('delivery', 'ArrowLeft')
    expect(ids()).not.toContain('build')
    key('delivery', 'ArrowRight')
    expect(ids()).toContain('build')
    key('delivery', 'Enter')
    expect(ids()).not.toContain('build')
    expect(opened).toEqual([])
    key('design', 'ArrowLeft')
    expect(api().focusTask).toBe('discovery')
    key('review', 'Enter')
    expect(opened).toEqual(['review'])
  })

  it('an arrow may start at a group’s summary; a hidden task’s arrows go from its group’s row, and none between two it hides', () => {
    const { api, send } = make()
    const fromGroup = api().links.find((link) => link.from === 'discovery')!
    // Out of the summary's end (18 Sept, day 18) on its row (0), into the milestone below its tasks.
    expect(fromGroup.points[0]).toEqual({ x: 18, gap: 0, y: 0.5 })
    expect(fromGroup.points.at(-1)).toEqual({ x: 20.5, gap: -1, y: 3.5 })
    send({ type: 'TOGGLE', group: 'delivery' })
    const links = api().links
    expect(links.map((link) => `${link.from}>${link.to}`)).toEqual(['brief>design', 'discovery>review', 'review>build'])
    expect(links[2].points.at(-1)).toEqual({ x: 20, gap: 0, y: 4.5 })
  })
})
