import { describe, expect, it } from 'vitest'
import { type Adapter, freshTarget, part, parts } from './harness'

/**
 * Sparkline and legend: stateless, so the contract is the markup — the shape
 * core computed, the order it is drawn in, the attribute that carries a
 * series, and what a reader hears instead of a picture.
 */
export function sparklineConformance(adapter: Adapter) {
  const { sparkline } = adapter

  ;(sparkline ? describe : describe.skip)('sparkline', () => {
    it('draws the fill, then the line, then the dot of the last value', async () => {
      const m = await sparkline!({ values: [0, 5, 10], area: true }, freshTarget())
      const root = part(m.root, 'sparkline', 'root')!
      expect(root.tagName.toLowerCase()).toBe('svg')
      expect(root.getAttribute('viewBox')).toBe('0 0 120 32')
      expect(root.getAttribute('preserveAspectRatio')).toBe('none')
      // The order of the nodes is the order of drawing: swapped, the line goes under its own fill.
      expect([...root.children].map((el) => el.getAttribute('data-part'))).toEqual(['area', 'line', 'last'])
      expect(part(root, 'sparkline', 'line')!.getAttribute('d')).toBe('M0,32 60,16 120,0')
      expect(part(root, 'sparkline', 'area')!.getAttribute('d')).toBe('M0,32 60,16 120,0 120,32 0,32Z')
      const dot = part(root, 'sparkline', 'last')!
      expect([dot.getAttribute('cx'), dot.getAttribute('cy')]).toEqual(['120', '0'])
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('draws no fill it was not asked for, and drops the dot when refused', async () => {
      const m = await sparkline!({ values: [1, 2, 3] }, freshTarget())
      expect(part(m.root, 'sparkline', 'area')).toBeNull()
      expect(part(m.root, 'sparkline', 'last')).not.toBeNull()
      await m.update({ last: false })
      expect(part(m.root, 'sparkline', 'last')).toBeNull()
    })

    it('is a picture with a name, or a picture hidden — never an unnamed one', async () => {
      const m = await sparkline!({ values: [31, 42], locale: 'en-US' }, freshTarget())
      const root = part(m.root, 'sparkline', 'root')!
      expect(root.getAttribute('role')).toBe('img')
      expect(root.getAttribute('aria-label')).toBe('42, up from 31')
      expect(root.hasAttribute('aria-hidden')).toBe(false)
      // Under a metric the number stands beside it in text, and the picture goes quiet.
      await m.update({ describe: false })
      expect(part(m.root, 'sparkline', 'root')!.getAttribute('aria-hidden')).toBe('true')
      expect(part(m.root, 'sparkline', 'root')!.hasAttribute('role')).toBe(false)
      expect(part(m.root, 'sparkline', 'root')!.hasAttribute('aria-label')).toBe(false)
    })

    it('carries a series as data, and none where there is one line', async () => {
      const m = await sparkline!({ values: [1, 2], series: 4 }, freshTarget())
      expect(part(m.root, 'sparkline', 'root')!.getAttribute('data-series')).toBe('4')
      await m.update({ series: undefined })
      expect(part(m.root, 'sparkline', 'root')!.hasAttribute('data-series')).toBe(false)
    })

    it('follows new values, and a flat series still draws a line', async () => {
      const m = await sparkline!({ values: [0, 10] }, freshTarget())
      await m.update({ values: [7, 7, 7] })
      expect(part(m.root, 'sparkline', 'line')!.getAttribute('d')).toBe('M0,16 60,16 120,16')
    })

    it('one value draws nothing at all, and does not throw', async () => {
      const m = await sparkline!({ values: [42], area: true }, freshTarget())
      const root = part(m.root, 'sparkline', 'root')!
      expect(root.children.length).toBe(0)
      expect(root.hasAttribute('data-empty')).toBe(true)
      expect(root.getAttribute('aria-label')).toBe('No data')
      await m.update({ values: [1, 2] })
      expect(part(m.root, 'sparkline', 'line')).not.toBeNull()
    })
  })
}

export function legendConformance(adapter: Adapter) {
  const { legend } = adapter

  ;(legend ? describe : describe.skip)('legend', () => {
    const items = [
      { label: 'Render', series: 1 as const, value: '18.2 s' },
      { label: 'Physics', series: 2 as const, value: '11.5 s' },
    ]

    it('is a list, one item per series, the swatch before the words', async () => {
      const m = await legend!({ items }, freshTarget())
      const root = part(m.root, 'legend', 'root')!
      expect(root.tagName.toLowerCase()).toBe('ul')
      const entries = parts(root, 'legend', 'item')
      expect(entries.map((el) => el.tagName.toLowerCase())).toEqual(['li', 'li'])
      expect([...entries[0]!.children].map((el) => el.getAttribute('data-part'))).toEqual(['swatch', 'label', 'value'])
      expect(parts(root, 'legend', 'label').map((el) => el.textContent)).toEqual(['Render', 'Physics'])
      expect(parts(root, 'legend', 'value').map((el) => el.textContent)).toEqual(['18.2 s', '11.5 s'])
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('the swatch carries the series and says nothing: the label says which', async () => {
      const m = await legend!({ items }, freshTarget())
      const swatches = parts(m.root, 'legend', 'swatch')
      expect(swatches.map((el) => el.getAttribute('data-series'))).toEqual(['1', '2'])
      expect(swatches.every((el) => el.getAttribute('aria-hidden') === 'true')).toBe(true)
      expect(swatches.every((el) => el.textContent === '')).toBe(true)
    })

    it('one series is not a category: no series, no attribute', async () => {
      const m = await legend!({ items: [{ label: 'Runs' }] }, freshTarget())
      expect(part(m.root, 'legend', 'swatch')!.hasAttribute('data-series')).toBe(false)
      expect(part(m.root, 'legend', 'value')).toBeNull()
    })

    it('the list has a name, and a direction', async () => {
      const m = await legend!({ items }, freshTarget())
      const root = part(m.root, 'legend', 'root')!
      expect(root.getAttribute('aria-label')).toBe('Chart key')
      expect(root.getAttribute('data-direction')).toBe('row')
      await m.update({ label: 'Time by module', direction: 'column' })
      expect(part(m.root, 'legend', 'root')!.getAttribute('aria-label')).toBe('Time by module')
      expect(part(m.root, 'legend', 'root')!.getAttribute('data-direction')).toBe('column')
    })

    it('follows new items, in the order given', async () => {
      const m = await legend!({ items }, freshTarget())
      await m.update({ items: [{ label: 'Audio', series: 3, value: '4.2 s' }] })
      expect(parts(m.root, 'legend', 'label').map((el) => el.textContent)).toEqual(['Audio'])
      expect(part(m.root, 'legend', 'swatch')!.getAttribute('data-series')).toBe('3')
    })
  })
}
