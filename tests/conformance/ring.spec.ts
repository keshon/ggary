import { describe, expect, it } from 'vitest'
import { RING_CIRCUMFERENCE } from '../../packages/core/src/components/ring'
import { type Adapter, freshTarget, part } from './harness'

/**
 * The ring is the kit's first drawing whose shape comes from the data, so the
 * contract adds one thing to the meter's: the geometry core computed has to
 * survive the trip through each framework's SVG handling intact.
 */
export function ringConformance(adapter: Adapter) {
  const mount = adapter.ring
  if (!mount) return

  // `part` is typed for HTML; a ring's parts are SVG, which carries `style` all the same.
  const inlineStyle = (element: Element) => (element as unknown as SVGElement).style
  const dashoffset = (element: Element) => Number(inlineStyle(element).getPropertyValue('stroke-dashoffset'))

  describe('ring', () => {
    it('is an svg in the box the dash was computed in, and reads as a meter', async () => {
      const m = await mount({ value: 18, max: 60, label: 'Budget spent', locale: 'en-GB' }, freshTarget())
      const root = part(m.root, 'ring', 'root')!
      expect(root.tagName.toLowerCase()).toBe('svg')
      expect(root.getAttribute('viewBox')).toBe('0 0 20 20')
      expect(root.getAttribute('role')).toBe('meter')
      expect(root.getAttribute('aria-label')).toBe('Budget spent')
      expect(root.getAttribute('aria-valuemin')).toBe('0')
      expect(root.getAttribute('aria-valuemax')).toBe('60')
      expect(root.getAttribute('aria-valuenow')).toBe('18')
      expect(root.getAttribute('aria-valuetext')).toBe('18 of 60')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('the track and the arc are the same circle, and the arc carries the value', async () => {
      const m = await mount({ value: 25, label: 'Budget spent' }, freshTarget())
      for (const name of ['track', 'arc']) {
        const circle = part(m.root, 'ring', name)!
        expect(circle.tagName.toLowerCase()).toBe('circle')
        expect(circle.getAttribute('cx')).toBe('10')
        expect(circle.getAttribute('cy')).toBe('10')
        expect(circle.getAttribute('r')).toBe('8')
      }
      const arc = part(m.root, 'ring', 'arc')!
      expect(Number(inlineStyle(arc).getPropertyValue('stroke-dasharray'))).toBeCloseTo(RING_CIRCUMFERENCE, 3)
      expect(dashoffset(arc)).toBeCloseTo(RING_CIRCUMFERENCE * 0.75, 3)
      await m.update({ value: 100 })
      expect(dashoffset(part(m.root, 'ring', 'arc')!)).toBeCloseTo(0, 3)
    })

    it('the figure at the centre is the share, and only the large ring holds one', async () => {
      const big = await mount({ value: 18, max: 60, label: 'Budget spent', size: 'lg', locale: 'en-GB' }, freshTarget())
      const figure = part(big.root, 'ring', 'value')!
      expect(figure.tagName.toLowerCase()).toBe('text')
      expect(figure.textContent).toBe('30')
      expect(figure.getAttribute('aria-hidden')).toBe('true')
      const small = await mount({ value: 18, max: 60, label: 'Budget spent', size: 'sm' }, freshTarget())
      expect(part(small.root, 'ring', 'value')).toBeNull()
    })

    it('over the maximum the arc closes and the words keep the number that was given', async () => {
      const m = await mount({ value: 72, max: 60, label: 'Budget spent', locale: 'en-GB' }, freshTarget())
      const root = part(m.root, 'ring', 'root')!
      expect(root.dataset.state).toBe('over')
      expect(root.getAttribute('aria-valuenow')).toBe('60')
      expect(root.getAttribute('aria-valuetext')).toBe('72 of 60, over the maximum')
      expect(dashoffset(part(m.root, 'ring', 'arc')!)).toBeCloseTo(0, 3)
    })

    it('a ring repeating words beside it is hidden whole, role and values and all', async () => {
      const m = await mount({ value: 18, max: 60, label: 'Budget spent', decorative: true }, freshTarget())
      const root = part(m.root, 'ring', 'root')!
      expect(root.getAttribute('aria-hidden')).toBe('true')
      expect(root.hasAttribute('role')).toBe(false)
      expect(root.hasAttribute('aria-label')).toBe(false)
      expect(root.hasAttribute('aria-valuenow')).toBe(false)
      // The arc is unchanged: it is only the telling that stops, not the drawing.
      expect(dashoffset(part(m.root, 'ring', 'arc')!)).toBeCloseTo(RING_CIRCUMFERENCE * 0.7, 3)
    })

    it('follows a new tone and size, and carries no series', async () => {
      const m = await mount({ value: 88, label: 'Budget spent', tone: 'warn' }, freshTarget())
      const root = () => part(m.root, 'ring', 'root')!
      expect(root().dataset.tone).toBe('warn')
      expect(root().dataset.size).toBe('md')
      expect(root().hasAttribute('data-series')).toBe(false)
      await m.update({ tone: 'error', size: 'lg' })
      expect(root().dataset.tone).toBe('error')
      expect(root().dataset.size).toBe('lg')
    })
  })
}
