import { describe, expect, it } from 'vitest'
import { connect, createGanttMachine, rangeOf, scaleRows, tabStop } from '../packages/core/src/components/gantt'
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
