import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from '@vitest/browser/context'
import '../packages/theme-ggarry/src/index.css'
import { createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Gantt } from '../packages/react/src/index'
import { addDays, todayISO } from '../packages/core/src/utils/calendar'
import { plan, planRange } from './conformance/plan'

/**
 * The Gantt where only a browser can say: bars measured to the pixel at the
 * theme's day width, the list and the scale staying put as the chart scrolls
 * each way, a task reached by the keyboard brought into view clear of the
 * list, and the chart opening on today.
 */

let root: Root | null = null
afterEach(() => {
  root?.unmount()
  root = null
  document.body.replaceChildren()
})

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function mount(props: Record<string, unknown>, style = 'inline-size: 700px; block-size: 240px; display: flex') {
  await page.viewport(1000, 700)
  const host = document.createElement('div')
  host.style.cssText = style
  document.body.append(host)
  root = createRoot(host)
  root.render(h(Gantt, { locale: 'en-GB', ...props }))
  await wait(80)
  const chart = host.querySelector<HTMLElement>('[data-scope="gantt"][data-part="root"]')!
  chart.style.flex = '1'
  chart.style.minInlineSize = '0'
  await wait(30)
  const schedule = (id: string) => host.querySelector<HTMLElement>(`[data-part="schedule"][data-task="${id}"]`)!
  return { host, chart, schedule }
}

describe('gantt', () => {
  it('draws each bar where its days are: 32 pixels a day at the day scale, 14 at the week scale', async () => {
    const { chart, schedule } = await mount({ tasks: plan, range: planRange })
    const origin = schedule('design').getBoundingClientRect().left
    const bar = schedule('design').querySelector<HTMLElement>('[data-part="bar"]')!.getBoundingClientRect()
    expect(bar.left - origin).toBeCloseTo(9 * 32 + 1, 0)
    expect(bar.width).toBeCloseTo(9 * 32 - 2, 0)
    const diamond = schedule('review').querySelector<HTMLElement>('[data-part="milestone"]')!.getBoundingClientRect()
    expect(diamond.left + diamond.width / 2 - origin).toBeCloseTo(20.5 * 32, 0)
    chart.setAttribute('data-scale', 'week')
    await wait(20)
    const narrow = schedule('design').querySelector<HTMLElement>('[data-part="bar"]')!.getBoundingClientRect()
    expect(narrow.width).toBeCloseTo(9 * 14 - 2, 0)
  })

  it('keeps the list at its left edge and the scale at its top as it scrolls', async () => {
    const tasks = Array.from({ length: 30 }, (_, i) => ({ id: `t${i}`, title: `Task ${i + 1}`, start: addDays('2026-09-01', i), end: addDays('2026-09-03', i) }))
    const { chart } = await mount({ tasks, range: { start: '2026-08-25', end: '2026-10-20' } })
    const box = chart.getBoundingClientRect()
    chart.scrollLeft = 600
    chart.scrollTop = 300
    await wait(30)
    const title = chart.querySelector<HTMLElement>('[data-part="row"]:nth-child(15) [data-part="title"]')!.getBoundingClientRect()
    expect(title.left).toBeCloseTo(box.left + 1, 0)
    const header = chart.querySelector<HTMLElement>('[data-part="header"]')!.getBoundingClientRect()
    expect(header.top).toBeCloseTo(box.top + 1, 0)
  })

  it('a task reached by the keyboard is brought into view, clear of the list', async () => {
    const tasks = [...plan, { id: 'late', title: 'Close the project', start: '2026-12-01', end: '2026-12-10' }]
    const { chart, schedule } = await mount({ tasks, range: { start: '2026-09-01', end: '2026-12-31' } })
    schedule('brief').focus()
    await userEvent.keyboard('{End}')
    await wait(30)
    expect(document.activeElement).toBe(schedule('late'))
    const bar = schedule('late').querySelector<HTMLElement>('[data-part="bar"]')!.getBoundingClientRect()
    const box = chart.getBoundingClientRect()
    expect(bar.left).toBeGreaterThanOrEqual(box.left + 240 - 1)
    expect(bar.right).toBeLessThanOrEqual(box.right + 1)
  })

  it('opens on today, a third of the way into the timeline', async () => {
    const today = todayISO()
    const tasks = [{ id: 'a', title: 'Around today', start: addDays(today, -40), end: addDays(today, 40) }]
    const { chart } = await mount({ tasks })
    const line = chart.querySelector<HTMLElement>('[data-part="today"]')!.getBoundingClientRect()
    const box = chart.getBoundingClientRect()
    const room = box.width - 240
    expect(line.left - box.left - 240).toBeGreaterThan(room * 0.2)
    expect(line.left - box.left - 240).toBeLessThan(room * 0.5)
  })
})
