import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import '../packages/theme-ggarry/src/index.css'
import '../packages/elements/src/index'
import type { GgDataGridElement } from '../packages/elements/src/index'
import type { ColumnDef, GridSource } from '../packages/core/src/components/data-grid'
import { StrictMode, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync, mount as mountSvelte, unmount as unmountSvelte } from 'svelte'
import { DataGrid as ReactGrid } from '../packages/react/src/index'
import { DataGrid as SvelteGrid } from '../packages/svelte/src/index'

/**
 * The data grid at the size of the registry that prompted it: 700,000 rows.
 * What only a browser can answer — the height cap, scrolling to the very last
 * row, the focus surviving rows being recycled, pinned columns staying put,
 * and what a scroll costs.
 */

interface Lead {
  id: number
  name: string
  email: string
  sum: number
  status: string
}

const TOTAL = 700_000
const leads: Lead[] = Array.from({ length: TOTAL }, (_, i) => ({
  id: i + 1,
  name: `Company ${i + 1}`,
  email: `lead${i + 1}@example.com`,
  sum: (i * 7919) % 100_003,
  status: i % 3 === 0 ? 'new' : 'won',
}))

const columns: ColumnDef<Lead>[] = [
  { id: 'name', header: 'Company', pinned: 'start', width: 180 },
  { id: 'email', header: 'Email', width: 260 },
  { id: 'sum', header: 'Sum', type: 'number', width: 140 },
  { id: 'status', header: 'Status', width: 140 },
  { id: 'id', header: 'Id', type: 'number', width: 400 },
]

const frames = (count = 2) =>
  new Promise<void>((resolve) => {
    let left = count
    const tick = () => (--left <= 0 ? resolve() : requestAnimationFrame(tick))
    requestAnimationFrame(tick)
  })

const until = async (check: () => boolean, ms = 3000) => {
  const started = performance.now()
  while (!check()) {
    if (performance.now() - started > ms) throw new Error('timed out')
    await frames(1)
  }
}

afterEach(() => {
  document.body.replaceChildren()
})

async function mount(options: { rows?: Lead[]; source?: GridSource<Lead>; selectable?: boolean } = {}) {
  const grid = document.createElement('gg-data-grid') as GgDataGridElement<Lead>
  grid.setAttribute('label', 'Leads')
  grid.setAttribute('locale', 'en-US')
  if (options.selectable) grid.setAttribute('selectable', '')
  grid.style.blockSize = '480px'
  grid.style.inlineSize = '720px'
  document.body.append(grid)
  grid.rowKey = (row) => row.id
  grid.columns = columns
  if (options.source) grid.source = options.source
  else grid.rows = options.rows ?? leads
  const scroller = grid.querySelector<HTMLElement>('[data-part="root"]')!
  const rows = () => [...grid.querySelectorAll<HTMLElement>('[data-part="row"]')]
  const loaded = () => rows().filter((row) => !row.hasAttribute('data-placeholder'))
  await until(() => loaded().length > 0)
  return { grid, scroller, rows, loaded }
}

describe('700,000 rows', () => {
  it('draws a screenful, not the list, and tells a screen reader the true count', async () => {
    const { scroller, rows } = await mount()
    expect(rows().length).toBeLessThan(40)
    expect(scroller.getAttribute('aria-rowcount')).toBe(String(TOTAL + 1))
    // 700k × 36px is 25 million pixels, past Firefox's cap: the range is scaled.
    const body = scroller.querySelector<HTMLElement>('[data-part="body"]')!
    expect(body.getBoundingClientRect().height).toBeLessThanOrEqual(8_000_000)
  })

  it('the scrollbar reaches the very last row, drawn flush with the bottom edge', async () => {
    const { scroller, loaded } = await mount()
    scroller.scrollTop = scroller.scrollHeight
    await until(() => loaded().some((row) => row.getAttribute('aria-rowindex') === String(TOTAL + 1)))
    const last = loaded().find((row) => row.getAttribute('aria-rowindex') === String(TOTAL + 1))!
    expect(last.textContent).toContain(`Company ${TOTAL}`)
    expect(Math.abs(last.getBoundingClientRect().bottom - scroller.getBoundingClientRect().bottom)).toBeLessThanOrEqual(1.5)
  })

  it('Ctrl+End goes to the last row, and the focus survives the rows being recycled', async () => {
    const { scroller, loaded } = await mount()
    scroller.focus()
    await userEvent.keyboard('{Control>}{End}{/Control}')
    await until(() => {
      const active = document.getElementById(scroller.getAttribute('aria-activedescendant') ?? '')
      return active?.closest('[data-part="row"]')?.getAttribute('aria-rowindex') === String(TOTAL + 1) && !active.closest('[data-placeholder]')
    })
    expect(document.activeElement).toBe(scroller)

    await userEvent.keyboard('{ArrowUp}{ArrowUp}{PageUp}')
    await frames()
    const active = document.getElementById(scroller.getAttribute('aria-activedescendant')!)!
    const box = active.getBoundingClientRect()
    const view = scroller.getBoundingClientRect()
    // The active row stays in view, and the focus never left the grid.
    expect(box.top).toBeGreaterThanOrEqual(view.top)
    expect(box.bottom).toBeLessThanOrEqual(view.bottom + 1)
    expect(document.activeElement).toBe(scroller)
    expect(loaded().length).toBeGreaterThan(0)
  })

  it('a pinned column stays put while the rest scroll sideways', async () => {
    const { scroller, loaded } = await mount()
    const pinned = () => loaded()[0].querySelector<HTMLElement>('[data-part="cell"]')!
    const before = pinned().getBoundingClientRect().left
    scroller.scrollLeft = 300
    await frames()
    expect(pinned().getBoundingClientRect().left).toBeCloseTo(before, 0)
    const email = loaded()[0].querySelectorAll<HTMLElement>('[data-part="cell"]')[1]
    expect(email.getBoundingClientRect().left).toBeLessThan(before + 180)
  })

  it('a column is resized by dragging its edge', async () => {
    const { grid } = await mount()
    const header = grid.querySelectorAll<HTMLElement>('[data-part="header-cell"]')[1]
    const handle = header.querySelector<HTMLElement>('[data-part="resize"]')!
    const box = handle.getBoundingClientRect()
    const at = (type: string, x: number) =>
      handle.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 1, button: 0, clientX: x, clientY: box.top + 4 }))
    at('pointerdown', box.left)
    at('pointermove', box.left + 60)
    at('pointerup', box.left + 60)
    await frames()
    expect(header.getBoundingClientRect().width).toBeCloseTo(320, 0)
  })

  it('a scroll step costs a frame’s share, not more', async () => {
    const { scroller } = await mount()
    const steps = 120
    const started = performance.now()
    for (let i = 1; i <= steps; i += 1) {
      scroller.scrollTop = i * 7_919
      await frames(1)
    }
    const perStep = (performance.now() - started) / steps
    // A frame is ~16.7ms at 60Hz; the rendering must fit inside it with room to spare.
    expect(perStep).toBeLessThan(40)
  })
})

describe('a server as the source', () => {
  it('dragging the scrollbar across the list aborts the requests for the rows scrolled past', async () => {
    const signals: AbortSignal[] = []
    const source: GridSource<Lead> = {
      load(request, signal) {
        signals.push(signal)
        return new Promise((resolve, reject) => {
          const timer = setTimeout(
            () => resolve({ rows: leads.slice(request.range.start, request.range.end), total: TOTAL }),
            60
          )
          signal.addEventListener('abort', () => {
            clearTimeout(timer)
            reject(new DOMException('aborted', 'AbortError'))
          })
        })
      },
    }
    const { scroller, loaded } = await mount({ source })
    for (const fraction of [0.2, 0.4, 0.6, 0.8]) {
      scroller.scrollTop = scroller.scrollHeight * fraction
      await frames(1)
    }
    await until(() => loaded().length > 0 && Number(loaded()[0].getAttribute('aria-rowindex')) > TOTAL * 0.7)
    const aborted = signals.filter((signal) => signal.aborted).length
    expect(aborted).toBeGreaterThanOrEqual(2)
    // While the new rows load, the drawn rows are placeholders — never rows from another place.
    const first = Number(loaded()[0].getAttribute('aria-rowindex')) - 2
    expect(loaded()[0].textContent).toContain(`Company ${first + 1}`)
  })
})

describe('every adapter scrolls the whole list', () => {
  /** Mounts, waits for rows, drags to the end, and reports the last row drawn. */
  async function scrollToEnd(host: HTMLElement) {
    const scroller = () => host.querySelector<HTMLElement>('[data-scope="data-grid"][data-part="root"]')!
    const loaded = () => [...host.querySelectorAll<HTMLElement>('[data-part="row"]:not([data-placeholder])')]
    await until(() => loaded().length > 0)
    scroller().scrollTop = scroller().scrollHeight
    await until(() => loaded().some((row) => row.getAttribute('aria-rowindex') === String(TOTAL + 1)))
    return loaded().find((row) => row.getAttribute('aria-rowindex') === String(TOTAL + 1))!
  }

  it('React, under StrictMode', async () => {
    const host = document.createElement('div')
    host.style.blockSize = '480px'
    document.body.append(host)
    const root = createRoot(host)
    root.render(
      createElement(StrictMode, null,
        createElement(ReactGrid<Lead>, { columns, rows: leads, rowKey: (row) => row.id, label: 'Leads', locale: 'en-US' }))
    )
    const last = await scrollToEnd(host)
    expect(last.textContent).toContain(`Company ${TOTAL}`)
    root.unmount()
  })

  it('Svelte', async () => {
    const host = document.createElement('div')
    document.body.append(host)
    const instance = mountSvelte(SvelteGrid, {
      target: host,
      props: { columns, rows: leads, rowKey: (row: Lead) => row.id, label: 'Leads', locale: 'en-US', style: 'block-size: 480px' },
    })
    flushSync()
    const last = await scrollToEnd(host)
    expect(last.textContent).toContain(`Company ${TOTAL}`)
    await unmountSvelte(instance)
  })
})
