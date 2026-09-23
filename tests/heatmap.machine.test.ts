import { describe, expect, it } from 'vitest'
import { connect, heatmapLevel, heatmapThresholds } from '../packages/core/src/components/heatmap'
import { addDays } from '../packages/core/src/utils/calendar'

/** A heatmap has no state: the contract is the grid, the steps and the words. */
const same = (p: Record<string, unknown>) => p

/** A run of days from a first date, one value each. */
const run = (from: string, values: number[]) => values.map((value, i) => ({ date: addDays(from, i), value }))

const cells = (api: ReturnType<typeof connect<Record<string, unknown>>>) => api.weeks.flatMap((week) => week.days)

describe('heatmap steps', () => {
  it('cuts the four steps by rank, so one huge day does not flatten the rest', () => {
    expect(heatmapThresholds([1, 2, 3, 4])).toEqual([1, 2, 3])
    // The 400 is the top quarter on its own; the small days keep their steps.
    const ranked = heatmapThresholds([1, 1, 2, 2, 3, 3, 4, 400])
    expect(heatmapLevel(1, ranked)).toBe(1)
    expect(heatmapLevel(3, ranked)).toBe(3)
    expect(heatmapLevel(400, ranked)).toBe(4)
  })

  it('a day nothing was counted on is the empty ground, whatever the cuts are', () => {
    const cuts = heatmapThresholds([5, 10, 15, 20])
    expect(heatmapLevel(0, cuts)).toBe(0)
    expect(heatmapLevel(-3, cuts)).toBe(0)
    expect(heatmapLevel(Number.NaN, cuts)).toBe(0)
  })

  it('equal values take the same step: a field with no intensity is one step throughout', () => {
    const flat = heatmapThresholds([4, 4, 4, 4])
    expect([4, 4, 4].map((value) => heatmapLevel(value, flat))).toEqual([1, 1, 1])
  })

  it('with nothing counted at all there are no cuts and no steps', () => {
    expect(heatmapThresholds([])).toEqual([0, 0, 0])
    expect(heatmapLevel(0, [0, 0, 0])).toBe(0)
  })
})

describe('heatmap', () => {
  // 2026-01-01 is a Thursday; the week starting Monday begins on 2025-12-29.
  const year = run('2026-01-01', Array.from({ length: 365 }, (_, i) => i % 7))

  it('is one picture with one name: the quantity in words, not the shape', () => {
    const api = connect({ days: run('2026-01-01', [1, 2, 3]), weekStart: 1, label: 'Runs a day', unit: 'runs', locale: 'en-GB' }, same)
    expect(api.rootProps).toMatchObject({ 'data-scope': 'heatmap', 'data-part': 'root', role: 'img' })
    expect(api.rootProps['aria-label']).toBe('Runs a day: 6 runs over 1 week, the busiest 3 on 3 January')
    expect(api.label).toBe(api.rootProps['aria-label'])
    expect(api.total).toBe(6)
  })

  it('lays the days out in weeks of seven, from the week’s first day', () => {
    const api = connect({ days: run('2026-01-01', [1, 1, 1]), weekStart: 1, locale: 'en-GB' }, same)
    expect(api.weeks).toHaveLength(1)
    expect(api.weeks[0].key).toBe('2025-12-29')
    expect(api.weeks[0].days.map((day) => day.date)).toEqual([
      '2025-12-29', '2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04',
    ])
  })

  it('keeps the room for the days outside the range, and no mark on them', () => {
    const api = connect({ days: run('2026-01-01', [1, 1, 1]), weekStart: 1, locale: 'en-GB' }, same)
    const days = api.weeks[0].days
    expect(days.map((day) => day.empty)).toEqual([true, true, true, false, false, false, true])
    expect(days[0].dayProps).toMatchObject({ 'data-scope': 'heatmap', 'data-part': 'day', 'data-empty': '', 'aria-hidden': 'true' })
    expect(days[0].dayProps['data-level']).toBeUndefined()
    expect(days[0].dayProps.title).toBeUndefined()
  })

  it('a year is fifty-two or fifty-three columns of seven days, whole weeks throughout', () => {
    const api = connect({ days: year, weekStart: 1, locale: 'en-GB' }, same)
    expect(api.weeks.length).toBeGreaterThanOrEqual(52)
    expect(api.weeks.length).toBeLessThanOrEqual(54)
    expect(api.weeks.every((week) => week.days.length === 7)).toBe(true)
    expect(cells(api).filter((day) => !day.empty)).toHaveLength(365)
  })

  it('gives each cell its step and a title for the pointer, and hides it from a screen reader', () => {
    const api = connect({ days: run('2026-01-01', [0, 5]), weekStart: 1, unit: 'runs', locale: 'en-GB' }, same)
    const [quiet, busy] = cells(api).filter((day) => !day.empty)
    expect(quiet.dayProps).toMatchObject({ 'data-level': '0', title: 'No runs on 1 January', 'aria-hidden': 'true' })
    expect(busy.dayProps).toMatchObject({ 'data-level': '1', title: '5 runs on 2 January' })
    expect(busy.dayProps['data-empty']).toBeUndefined()
  })

  it('takes words of its own for the cells and the summary', () => {
    const api = connect(
      { days: run('2026-01-01', [3]), weekStart: 1, locale: 'ru-RU', unit: 'запусков' },
      same,
      {
        day: (value, date, unit) => `${date}: ${value} ${unit}`,
        summary: (total, weeks, busiest, unit) => `${total} ${unit} за ${weeks} нед., больше всего ${busiest?.value} — ${busiest?.date}`,
      }
    )
    expect(cells(api).find((day) => !day.empty)!.dayProps.title).toBe('1 января: 3 запусков')
    expect(api.rootProps['aria-label']).toBe('3 запусков за 1 нед., больше всего 3 — 1 января')
  })

  it('adds up the records of one day: the field counts days, not runs', () => {
    const api = connect({ days: [{ date: '2026-01-01', value: 2 }, { date: '2026-01-01', value: 3 }], weekStart: 1, locale: 'en-GB' }, same)
    expect(api.total).toBe(5)
    expect(cells(api).filter((day) => !day.empty)).toHaveLength(1)
    expect(api.rootProps['aria-label']).toContain('the busiest 5 on 1 January')
  })

  it('names a month that owns at least two columns, and leaves a single one unnamed', () => {
    const api = connect({ days: year, weekStart: 1, locale: 'en-GB' }, same)
    const named = api.weeks.filter((week) => week.monthLabel)
    expect(named.map((week) => week.monthLabel)).toEqual(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'])
    expect(named[0].monthLabelProps).toMatchObject({ 'data-part': 'month-label', 'aria-hidden': 'true' })
    // One week of December: not two columns, so no label over it.
    const short = connect({ days: run('2026-12-01', [1, 1, 1]), weekStart: 1, locale: 'en-GB' }, same)
    expect(short.weeks.map((week) => week.monthLabel)).toEqual([undefined])
  })

  it('starts the week where the locale does, unless told otherwise', () => {
    const sunday = connect({ days: run('2026-01-01', [1]), locale: 'en-US' }, same)
    expect(sunday.weeks[0].key).toBe('2025-12-28')
    const monday = connect({ days: run('2026-01-01', [1]), locale: 'en-GB' }, same)
    expect(monday.weeks[0].key).toBe('2025-12-29')
    const saturday = connect({ days: run('2026-01-01', [1]), weekStart: 6, locale: 'en-GB' }, same)
    expect(saturday.weeks[0].key).toBe('2025-12-27')
  })

  it('an empty field is named, not silent, and a day that is not a day is dropped', () => {
    const api = connect({ days: [] }, same)
    expect(api.weeks).toEqual([])
    expect(api.rootProps['aria-label']).toBe('Nothing yet')
    const nonsense = connect({ days: [{ date: '2026-02-31', value: 4 }, { date: 'yesterday', value: 1 }] }, same, { empty: 'No runs yet' })
    expect(nonsense.weeks).toEqual([])
    expect(nonsense.rootProps['aria-label']).toBe('No runs yet')
  })
})
