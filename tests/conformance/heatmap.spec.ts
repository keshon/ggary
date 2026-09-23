import { describe, expect, it } from 'vitest'
import { addDays } from '../../packages/core/src/utils/calendar'
import { type Adapter, freshTarget, part, parts } from './harness'

const run = (from: string, values: number[]) => values.map((value, i) => ({ date: addDays(from, i), value }))
// 2026-01-01 is a Thursday: a week starting Monday opens with three blanks.
const fortnight = run('2026-01-01', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13])

/**
 * A heatmap has no state either: what every adapter owes is the grid — a
 * column a week, seven cells in each, the blanks kept — the step on every
 * cell, and one name on the whole field.
 */
export function heatmapConformance(adapter: Adapter) {
  const test = adapter.heatmap ? it : it.skip
  describe('heatmap', () => {
    test('is one picture with one name: the quantity in words', async () => {
      const m = await adapter.heatmap!({ days: fortnight, weekStart: 1, unit: 'runs', label: 'Runs a day', locale: 'en-GB' }, freshTarget())
      const root = part(m.root, 'heatmap', 'root')!
      expect(root.getAttribute('role')).toBe('img')
      expect(root.getAttribute('aria-label')).toBe('Runs a day: 91 runs over 3 weeks, the busiest 13 on 14 January')
      // Nothing goes inside a cell: the months along the top are all the text there is.
      expect(parts(root, 'heatmap', 'day').every((day) => day.textContent === '')).toBe(true)
      expect(m.root.querySelector('[class]')).toBeNull()
      expect(m.root.querySelector('svg')).toBeNull()
    })

    test('a column a week, seven days in each, the blanks kept', async () => {
      const m = await adapter.heatmap!({ days: fortnight, weekStart: 1, locale: 'en-GB' }, freshTarget())
      const weeks = parts(m.root, 'heatmap', 'week')
      expect(weeks).toHaveLength(3)
      expect(weeks.every((week) => parts(week, 'heatmap', 'day').length === 7)).toBe(true)
      const first = parts(weeks[0], 'heatmap', 'day')
      expect(first.slice(0, 3).every((day) => day.hasAttribute('data-empty'))).toBe(true)
      expect(first.slice(0, 3).every((day) => day.hasAttribute('data-level'))).toBe(false)
      expect(first[3].hasAttribute('data-empty')).toBe(false)
    })

    test('every cell carries its step and its title, and is hidden from assistive tech', async () => {
      const m = await adapter.heatmap!({ days: fortnight, weekStart: 1, unit: 'runs', locale: 'en-GB' }, freshTarget())
      const days = parts(m.root, 'heatmap', 'day').filter((day) => !day.hasAttribute('data-empty'))
      expect(days).toHaveLength(14)
      expect(days.every((day) => day.getAttribute('aria-hidden') === 'true')).toBe(true)
      expect(days[0].dataset.level).toBe('0')
      expect(days[0].title).toBe('No runs on 1 January')
      expect(days[13].dataset.level).toBe('4')
      expect(days[13].title).toBe('13 runs on 14 January')
      expect(new Set(days.map((day) => day.dataset.level))).toEqual(new Set(['0', '1', '2', '3', '4']))
    })

    test('follows new days', async () => {
      const m = await adapter.heatmap!({ days: fortnight, weekStart: 1, locale: 'en-GB' }, freshTarget())
      await m.update({ days: run('2026-01-01', [1, 1, 1]), weekStart: 1, locale: 'en-GB' })
      expect(parts(m.root, 'heatmap', 'week')).toHaveLength(1)
      expect(parts(m.root, 'heatmap', 'day').filter((day) => !day.hasAttribute('data-empty'))).toHaveLength(3)
    })

    test('an empty field keeps its name and draws no cells', async () => {
      const m = await adapter.heatmap!({ days: [], words: { empty: 'No runs yet' } }, freshTarget())
      expect(part(m.root, 'heatmap', 'root')!.getAttribute('aria-label')).toBe('No runs yet')
      expect(parts(m.root, 'heatmap', 'week')).toHaveLength(0)
    })
  })
}
