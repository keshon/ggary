import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from '@vitest/browser/context'
import '../packages/theme-ggarry/src/index.css'
import { createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { History, Queue, Run } from '../packages/react/src/index'
import type { HistoryTick } from '../packages/core/src/components/history'

/**
 * The agent layer where only a browser can say: a strip that loses the OLD
 * attempts when it runs out of room, batches that divide the width they were
 * given, the dots of a queue standing on one vertical whatever the titles
 * are, and real focus roving through the rows.
 */

let root: Root | null = null
afterEach(() => {
  root?.unmount()
  root = null
  document.body.replaceChildren()
})

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function mount(node: ReturnType<typeof h>, style = 'inline-size: 420px') {
  await page.viewport(1000, 700)
  const host = document.createElement('div')
  host.style.cssText = style
  document.body.append(host)
  root = createRoot(host)
  root.render(node)
  await wait(60)
  return host
}

const ok: HistoryTick = { tone: 'ok' }
const box = (element: Element) => element.getBoundingClientRect()

describe('history', () => {
  it('keeps the latest attempt at the end and loses the oldest off the start', async () => {
    // Ninety-six marks at 3px with 2px between them want ~475px; the strip has 120.
    const ticks = Array.from({ length: 96 }, (_, i) => (i === 95 ? { tone: 'error' as const } : ok))
    const host = await mount(h(History, { ticks, label: 'A day of checks' }), 'inline-size: 120px')
    const strip = host.querySelector('[data-scope="history"][data-part="strip"]')!
    const marks = [...host.querySelectorAll('[data-part="tick"]')]
    expect(box(marks.at(-1)!).right).toBeCloseTo(box(strip).right, 0)
    // The oldest are outside the strip, and clipped rather than wrapped.
    expect(box(marks[0]).right).toBeLessThan(box(strip).left)
    expect(box(marks.at(-1)!).top).toBeCloseTo(box(marks[0]).top, 0)
    expect(box(strip).height).toBeCloseTo(16, 0)
  })

  it('batches divide the width they were given, in proportion to what stands behind them', async () => {
    const host = await mount(
      h(History, {
        groups: [
          { ticks: [ok], label: '00' },
          { ticks: Array.from({ length: 7 }, () => ok), label: '01' },
          { ticks: [ok], count: 8, label: '02' },
        ],
        size: 'lg',
      })
    )
    const strip = host.querySelector('[data-scope="history"][data-part="strip"]')!
    const groups = [...host.querySelectorAll('[data-part="group"]')]
    const widths = groups.map((group) => box(group).width)
    // Sixteen attempts over the strip: 1, 7 and 8 of it, less the gaps between them.
    expect(widths[1] / widths[0]).toBeCloseTo(7, 0)
    expect(widths[2]).toBeGreaterThan(widths[1])
    expect(box(groups.at(-1)!).right).toBeCloseTo(box(strip).right, 0)
    expect(box(groups[0]).left).toBeCloseTo(box(strip).left, 0)
    // A batch shown as one brick keeps its weight all the same.
    expect(host.querySelectorAll('[data-part="group"]')[2].querySelectorAll('[data-part="tick"]')).toHaveLength(1)
    // The ruler stands under the strip on the same shares.
    const cells = [...host.querySelectorAll('[data-part="axis-cell"]')]
    expect(box(cells[0]).left).toBeCloseTo(box(groups[0]).left, 0)
    expect(box(cells[0]).top).toBeGreaterThan(box(strip).bottom)
    expect(box(strip).height).toBeCloseTo(28, 0)
  })

  it('a dense batch thins its combs rather than growing past its share', async () => {
    const host = await mount(
      h(History, { groups: Array.from({ length: 12 }, () => ({ ticks: Array.from({ length: 12 }, () => ok) })) }),
      'inline-size: 300px'
    )
    const strip = host.querySelector('[data-scope="history"][data-part="strip"]')!
    const groups = [...host.querySelectorAll('[data-part="group"]')]
    expect(box(groups.at(-1)!).right).toBeCloseTo(box(strip).right, 0)
    expect(box(groups[0]).left).toBeGreaterThanOrEqual(box(strip).left - 0.5)
  })
})

describe('the run and the queue', () => {
  it('the dots of a queue stand on one vertical, whatever the titles are', async () => {
    const host = await mount(
      h(Queue, {
        label: 'The queue of agents',
        tasks: [
          { value: 'a', title: 'A', state: 'done' },
          { value: 'b', title: 'Generating the biomes of the northern continent', detail: 'world/biomes.ts', meta: '8.4 s', state: 'running' },
          { value: 'c', title: 'Baking', meta: '—', state: 'queued' },
        ],
      }),
      'inline-size: 220px'
    )
    const dots = [...host.querySelectorAll('[data-scope="dot"][data-part="root"]')]
    expect(dots).toHaveLength(3)
    const lefts = dots.map((dot) => box(dot).left)
    expect(lefts[1]).toBeCloseTo(lefts[0], 1)
    expect(lefts[2]).toBeCloseTo(lefts[0], 1)
    // A title too long for the row is cut rather than pushing the time out of it.
    const rows = [...host.querySelectorAll('[data-scope="task"][data-part="root"]')]
    const title = rows[1].querySelector('[data-part="title"]')!
    expect(title.scrollWidth).toBeGreaterThan(title.clientWidth)
    expect(box(rows[1].querySelector('[data-part="meta"]')!).right).toBeLessThanOrEqual(box(rows[1]).right)
    expect(box(rows[1]).width).toBeCloseTo(box(rows[0]).width, 1)
  })

  it('one Tab enters the queue, and the arrows move real focus inside it', async () => {
    const host = await mount(
      h('div', null, h('button', { type: 'button' }, 'Before'), h(Queue, {
        label: 'Queue',
        tasks: [
          { value: 'a', title: 'Parsing', state: 'done' },
          { value: 'b', title: 'Generating', state: 'done' },
          { value: 'c', title: 'Placing', state: 'running' },
        ],
      }))
    )
    host.querySelector('button')!.focus()
    await userEvent.tab()
    const rows = [...host.querySelectorAll('[data-scope="task"][data-part="root"]')]
    expect(document.activeElement).toBe(rows[0])
    await userEvent.keyboard('{ArrowDown}')
    await wait(30)
    expect(document.activeElement).toBe(rows[1])
    expect(rows[1].getAttribute('aria-selected')).toBe('true')
    await userEvent.keyboard('{End}')
    await wait(30)
    expect(document.activeElement).toBe(rows[2])
    // One stop for the list: Tab leaves it rather than walking it.
    await userEvent.tab()
    expect(document.activeElement).not.toBe(rows[0])
  })

  it('a run that has not begun draws its room, and the unit going pulses', async () => {
    const host = await mount(h(Run, { label: 'Agents finished', units: [{ tone: 'ok' }, { tone: 'running' }, {}] }))
    const [done, going, pending] = [...host.querySelectorAll('[data-scope="dot"][data-part="root"]')]
    const colour = (element: Element) => getComputedStyle(element).backgroundColor
    expect(colour(pending)).not.toBe(colour(done))
    expect(colour(pending)).not.toBe(colour(going))
    expect(going.getAnimations()).toHaveLength(1)
    expect(done.getAnimations()).toHaveLength(0)
    // The dots sit in a row beside the reading, not under it.
    const units = host.querySelector('[data-part="units"]')!
    const value = host.querySelector('[data-part="value"]')!
    expect(box(value).left).toBeGreaterThan(box(units).right)
  })
})
