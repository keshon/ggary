import { afterEach, describe, expect, it } from 'vitest'
import { page } from '@vitest/browser/context'
import '../packages/theme-ggarry/src/index.css'
import { createElement as h, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { FileChange, KeyValueList, Metric, MetricRow } from '../packages/react/src/index'

/**
 * Where only layout can say: the unit set below the number, the headline band
 * reaching the page title's step and no further, the joined band's hairlines
 * never hanging at its edge when it wraps, two lists sharing one name column
 * and a tight one giving it up, and a file change's word taking no room.
 */

let root: Root | null = null
afterEach(() => {
  root?.unmount()
  root = null
  document.body.replaceChildren()
})

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function mount(node: ReactNode, width = 600) {
  await page.viewport(1000, 700)
  const host = document.createElement('div')
  host.style.inlineSize = `${width}px`
  document.body.append(host)
  root = createRoot(host)
  root.render(node)
  await wait(40)
  return host
}

const px = (el: Element, property: string) => parseFloat(getComputedStyle(el).getPropertyValue(property))
const rect = (el: Element) => el.getBoundingClientRect()
const all = (host: HTMLElement, selector: string) => [...host.querySelectorAll<HTMLElement>(selector)]

const metrics = [
  { label: 'Run time', value: 42, unit: 's', delta: '18% down', direction: 'down' as const, tone: 'ok' as const },
  { label: 'Tests passed', value: 248, unit: '/251' },
  { label: 'Warnings', value: 12, delta: '5 new', direction: 'up' as const, tone: 'error' as const },
]
const row = (props: object) => h(MetricRow, props, ...metrics.map((m, i) => h(Metric, { key: i, ...m })))

describe('metric', () => {
  it('sets the unit smaller and quieter than the number, on its baseline', async () => {
    const host = await mount(row({}))
    const value = host.querySelector('[data-scope="metric"][data-part="value"]')!
    const unit = value.querySelector('[data-part="unit"]')!
    expect(px(value, 'font-size')).toBe(16)
    expect(px(unit, 'font-size')).toBe(12)
    expect(getComputedStyle(unit).color).not.toBe(getComputedStyle(value).color)
    expect(getComputedStyle(value).fontVariantNumeric).toContain('tabular-nums')
    // One line: the unit follows the number rather than dropping under it.
    expect(rect(unit).top).toBeGreaterThanOrEqual(rect(value).top)
    expect(rect(unit).bottom).toBeLessThanOrEqual(rect(value).bottom + 0.5)
  })

  it('the arrow is drawn in the delta’s ink, which is the tone’s text colour', async () => {
    const host = await mount(row({}))
    const [ok, , error] = all(host, '[data-scope="metric"][data-part="root"]')
    const okDelta = ok.querySelector('[data-part="delta"]')!
    const okIcon = okDelta.querySelector('[data-part="delta-icon"]')!
    expect(rect(okIcon).width).toBe(12)
    expect(getComputedStyle(okIcon).backgroundColor).toBe(getComputedStyle(okDelta).color)
    expect(getComputedStyle(error.querySelector('[data-part="delta"]')!).color).not.toBe(getComputedStyle(okDelta).color)
  })

  it('stands on a ground, not in a border', async () => {
    const host = await mount(row({}))
    const tile = host.querySelector('[data-scope="metric"][data-part="root"]')!
    expect(px(tile, 'border-top-width')).toBe(0)
    expect(getComputedStyle(tile).backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
  })

  it('the headline band takes the ceiling of the scale — the page title’s step — and a region’s does not', async () => {
    const host = await mount(h('div', null, row({}), row({ joined: true, headline: true })))
    const [plain, headline] = all(host, '[data-scope="metric-row"][data-part="root"]')
    const size = (band: HTMLElement) => px(band.querySelector('[data-part="value"]')!, 'font-size')
    expect(size(plain)).toBe(16)
    expect(size(headline)).toBe(20)
  })

  it('a joined band wraps with no hairline hanging at its edge', async () => {
    // 300 pixels hold two 140-pixel columns: the third metric starts a second line.
    const host = await mount(row({ joined: true }), 300)
    const band = host.querySelector<HTMLElement>('[data-scope="metric-row"][data-part="root"]')!
    const cells = all(band, '[data-scope="metric"][data-part="root"]')
    expect(getComputedStyle(band).overflow).toBe('hidden')
    expect(getComputedStyle(band).columnGap).toBe('0px')
    // The line lies outside each cell's start and top: at the band's own edges
    // (the first cell of each line, the first line) it falls past the band and is clipped.
    expect(rect(cells[0]).left).toBe(rect(band).left)
    expect(rect(cells[2]).left).toBe(rect(band).left)
    expect(rect(cells[0]).top).toBe(rect(band).top)
    // Between cells it lands on the neighbour's last pixel, one hairline.
    expect(rect(cells[1]).left).toBeCloseTo(rect(cells[0]).right, 1)
    expect(rect(cells[2]).top).toBeCloseTo(rect(cells[0]).bottom, 1)
    expect(getComputedStyle(cells[1]).boxShadow).toMatch(/-1px 0px 0px/)
    // The cells lose their own ground: the band is the one surface.
    expect(getComputedStyle(cells[0]).backgroundColor).toBe('rgba(0, 0, 0, 0)')
  })
})

describe('key–value list', () => {
  const short = [{ label: 'Model', value: 'opus' }, { label: 'Files', value: '4' }]
  const long = [{ label: 'Last modified', value: '14:32' }, { label: 'Owner', value: 'ada' }]

  it('two lists share one name column, so their values line up', async () => {
    const host = await mount(h('div', null, h(KeyValueList, { items: short }), h(KeyValueList, { items: long })))
    const [first, second] = all(host, '[data-scope="kv"][data-part="root"]')
    const valueLeft = (list: HTMLElement) => rect(list.querySelector('[data-part="detail"]')!).left
    expect(valueLeft(first)).toBe(valueLeft(second))
    expect(rect(first.querySelector('[data-part="term"]')!).width).toBe(120)
  })

  it('tight: the name column is as wide as its longest name', async () => {
    const host = await mount(h(KeyValueList, { items: short, tight: true }), 235)
    const list = host.querySelector<HTMLElement>('[data-scope="kv"][data-part="root"]')!
    const terms = all(list, '[data-part="term"]')
    const widest = Math.max(...terms.map((t) => rect(t).width))
    expect(widest).toBeLessThan(120)
    const gap = px(list, 'column-gap')
    expect(rect(list.querySelector('[data-part="detail"]')!).left).toBeCloseTo(rect(list).left + widest + gap, 0)
  })

  it('a name and its value share a line: the <dd> sits beside its <dt>, not under it', async () => {
    const host = await mount(h(KeyValueList, { items: long }))
    const term = host.querySelector('[data-part="term"]')!
    const detail = host.querySelector('[data-part="detail"]')!
    expect(Math.abs(rect(term).top - rect(detail).top)).toBeLessThan(2)
  })
})

describe('file change', () => {
  it('is a 16-pixel box with the sign in the middle, and its word takes no room', async () => {
    const host = await mount(h('div', null, h(FileChange, { change: 'modified' })))
    const box = host.querySelector('[data-scope="file-change"][data-part="root"]')!
    const sign = box.querySelector('[data-part="sign"]')!
    const label = box.querySelector('[data-part="label"]')!
    expect(rect(box).width).toBe(16)
    expect(rect(box).height).toBe(16)
    const mid = (r: DOMRect) => [r.left + r.width / 2, r.top + r.height / 2]
    const [bx, by] = mid(rect(box))
    const [sx, sy] = mid(rect(sign))
    expect(Math.abs(bx - sx)).toBeLessThan(1)
    expect(Math.abs(by - sy)).toBeLessThan(1.5)
    expect(rect(label).width).toBeLessThanOrEqual(1)
    expect(getComputedStyle(label).clipPath).toBe('inset(50%)')
  })

  it('the outline is the change’s colour; the sign stays quiet except for a conflict', async () => {
    const host = await mount(h('div', null, ...(['added', 'deleted', 'conflict'] as const).map((change) => h(FileChange, { key: change, change }))))
    const [added, deleted, conflict] = all(host, '[data-scope="file-change"][data-part="root"]')
    const border = (el: HTMLElement) => getComputedStyle(el).borderTopColor
    expect(border(added)).not.toBe(border(deleted))
    expect(getComputedStyle(added).color).toBe(getComputedStyle(deleted).color)
    expect(getComputedStyle(conflict).color).toBe(border(conflict))
    expect(getComputedStyle(conflict).color).not.toBe(getComputedStyle(added).color)
  })
})
