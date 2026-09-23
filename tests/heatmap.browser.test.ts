import { afterEach, describe, expect, it } from 'vitest'
import '../packages/theme-ggarry/src/index.css'
import { createElement as h } from 'react'
import { flushSync } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'
import { Heatmap } from '../packages/react/src/index'
import { addDays } from '../packages/core/src/utils/calendar'

/**
 * The field where only a browser can say it: seven rows that line up across
 * the weeks, time running to the right, a year that pans rather than wraps,
 * and the ramp coming out as five different fills.
 */

let root: Root | null = null
afterEach(() => {
  root?.unmount()
  root = null
  document.body.replaceChildren()
})

const year = Array.from({ length: 365 }, (_, i) => ({ date: addDays('2026-01-01', i), value: i % 9 }))

function mount(props: Record<string, unknown>, width = 900) {
  const host = document.createElement('div')
  host.style.cssText = `inline-size: ${width}px`
  document.body.append(host)
  root = createRoot(host)
  flushSync(() => root!.render(h(Heatmap as never, { weekStart: 1, locale: 'en-GB', ...props })))
  const field = host.querySelector<HTMLElement>('[data-scope="heatmap"][data-part="root"]')!
  const weeks = [...host.querySelectorAll<HTMLElement>('[data-part="week"]')]
  return { host, field, weeks }
}

describe('heatmap', () => {
  it('is seven rows of square cells, and the rows line up across every week', () => {
    const { weeks } = mount({ days: year })
    const rows = weeks.map((week) => [...week.querySelectorAll<HTMLElement>('[data-part="day"]')].map((day) => day.getBoundingClientRect()))
    expect(rows.every((week) => week.length === 7)).toBe(true)
    const first = rows[0]
    expect(first[0].width).toBeCloseTo(first[0].height, 0)
    for (const week of rows) {
      week.forEach((cell, day) => expect(cell.top).toBeCloseTo(first[day].top, 0))
    }
  })

  it('a week is a column, and the weeks run to the right as time does', () => {
    const { weeks } = mount({ days: year })
    const lefts = weeks.map((week) => week.getBoundingClientRect().left)
    expect(lefts.every((left, i) => i === 0 || left > lefts[i - 1])).toBe(true)
    const column = [...weeks[0].querySelectorAll<HTMLElement>('[data-part="day"]')].map((day) => day.getBoundingClientRect())
    expect(column.every((cell, i) => i === 0 || cell.top > column[i - 1].top)).toBe(true)
    expect(column.every((cell) => Math.abs(cell.left - column[0].left) < 0.5)).toBe(true)
  })

  it('a year does not wrap into two pictures: it pans inside its panel', () => {
    const { field, weeks } = mount({ days: year }, 300)
    expect(field.scrollWidth).toBeGreaterThan(field.clientWidth)
    const tops = weeks.map((week) => week.getBoundingClientRect().top)
    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(1)
  })

  it('the months hang above the grid, each over the week its month begins in', () => {
    const { field, weeks } = mount({ days: year })
    const labels = [...field.querySelectorAll<HTMLElement>('[data-part="month-label"]')]
    expect(labels.length).toBeGreaterThanOrEqual(11)
    const firstCell = weeks[0].querySelector<HTMLElement>('[data-part="day"]')!.getBoundingClientRect()
    for (const label of labels) {
      const box = label.getBoundingClientRect()
      expect(box.bottom).toBeLessThanOrEqual(firstCell.top + 0.5)
      expect(box.left).toBeCloseTo(label.closest<HTMLElement>('[data-part="week"]')!.getBoundingClientRect().left, 0)
    }
  })

  it('the five steps are five fills, the busiest the accent itself', () => {
    const { field } = mount({ days: year })
    const fill = (level: number) => getComputedStyle(field.querySelector<HTMLElement>(`[data-part="day"][data-level="${level}"]`)!).backgroundColor
    const fills = [0, 1, 2, 3, 4].map(fill)
    expect(new Set(fills).size).toBe(5)
    const probe = document.createElement('div')
    probe.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--ggarry-bg-accent').trim()
    document.body.append(probe)
    expect(fills[4]).toBe(getComputedStyle(probe).backgroundColor)
    probe.remove()
  })

  it('a page may size the cell, and the field grows with it', () => {
    const { field } = mount({ days: year, style: { '--gg-heatmap-cell': '16px' } })
    const cell = field.querySelector<HTMLElement>('[data-part="day"]')!.getBoundingClientRect()
    expect(cell.width).toBeCloseTo(16, 0)
    expect(cell.height).toBeCloseTo(16, 0)
  })
})
