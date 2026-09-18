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
  root.render(h(Gantt as never, { locale: 'en-GB', ...props }))
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

describe('gantt by pointer', () => {
  const pointer = (type: string, x: number, y: number) =>
    (document.elementFromPoint(x, y) ?? document.body).dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: 3, pointerType: 'mouse', isPrimary: true, button: 0, bubbles: true, cancelable: true }))
  const start = (bar: Element) => Number((bar as HTMLElement).style.getPropertyValue('--gg-gantt-start'))
  const span = (bar: Element) => Number((bar as HTMLElement).style.getPropertyValue('--gg-gantt-span'))

  it('a bar dragged three days’ worth moves three days, and the owner hears it on release', async () => {
    const changes: unknown[] = []
    const { schedule } = await mount({ tasks: plan, range: planRange, onChange: (change: { task: { id: string }; to: unknown }) => void changes.push([change.task.id, change.to]) }, 'inline-size: 1200px; block-size: 260px; display: flex')
    const bar = schedule('design').querySelector<HTMLElement>('[data-part="bar"]')!
    const box = bar.getBoundingClientRect()
    const y = box.top + box.height / 2
    pointer('pointerdown', box.left + 60, y)
    pointer('pointermove', box.left + 60 + 3 * 32 + 5, y)
    await wait(20)
    expect(start(bar)).toBe(12)
    expect(bar.hasAttribute('data-drafting')).toBe(true)
    pointer('pointerup', box.left + 60 + 3 * 32 + 5, y)
    await wait(30)
    expect(changes).toEqual([['design', { start: '2026-09-13', end: '2026-09-21' }]])
    expect(document.activeElement).toBe(schedule('design'))
  })

  it('its end, taken by the grip, resizes it; Escape in the middle puts it back', async () => {
    const changes: unknown[] = []
    const { schedule } = await mount({ tasks: plan, range: planRange, onChange: (change: unknown) => void changes.push(change) }, 'inline-size: 1200px; block-size: 260px; display: flex')
    const bar = schedule('design').querySelector<HTMLElement>('[data-part="bar"]')!
    const grip = bar.querySelector<HTMLElement>('[data-part="bar-end"]')!.getBoundingClientRect()
    const x = grip.left + grip.width / 2
    const y = grip.top + grip.height / 2
    pointer('pointerdown', x, y)
    pointer('pointermove', x + 2 * 32, y)
    await wait(20)
    expect([start(bar), span(bar)]).toEqual([9, 11])
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await wait(20)
    expect([start(bar), span(bar)]).toEqual([9, 9])
    pointer('pointerup', x + 2 * 32, y)
    await wait(20)
    expect(changes).toEqual([])
  })

  it('a refused move springs back', async () => {
    const { schedule } = await mount({ tasks: plan, range: planRange, onChange: () => Promise.reject(new Error('locked by the client')) }, 'inline-size: 1200px; block-size: 260px; display: flex')
    const bar = schedule('build').querySelector<HTMLElement>('[data-part="bar"]')!
    const box = bar.getBoundingClientRect()
    pointer('pointerdown', box.left + 40, box.top + 5)
    pointer('pointermove', box.left + 40 + 64, box.top + 5)
    pointer('pointerup', box.left + 40 + 64, box.top + 5)
    await wait(40)
    expect(start(bar)).toBe(20)
    expect(bar.hasAttribute('data-pending')).toBe(false)
  })
})
