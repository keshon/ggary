import { describe, expect, it } from 'vitest'
import { type Adapter, freshTarget, part, parts } from './harness'

const day = [
  { label: 'up', value: 22, tone: 'ok' as const },
  { label: 'down', value: 1.5, tone: 'error' as const },
  { label: 'unknown', value: 0.5, tone: 'neutral' as const },
]

/**
 * A share bar has no state: the contract is the markup. What matters in every
 * adapter is that the name carries the reading in words, that each part's
 * share reaches the DOM as a value, and that nothing but boxes is drawn.
 */
export function shareConformance(adapter: Adapter) {
  const test = it
  describe('share', () => {
    test('is one picture with one name, divided into a part per item', async () => {
      const m = await adapter.share({ items: day, unit: 'h', locale: 'en-GB', label: 'The last 24 hours' }, freshTarget())
      const root = part(m.root, 'share', 'root')!
      expect(root.getAttribute('role')).toBe('img')
      expect(root.getAttribute('aria-label')).toBe('The last 24 hours: 22 h up, 1.5 h down, 0.5 h unknown')
      expect(root.dataset.size).toBe('md')
      expect(root.textContent).toBe('')
      expect(parts(root, 'share', 'segment')).toHaveLength(3)
      expect(m.root.querySelector('[class]')).toBeNull()
      expect(m.root.querySelector('svg')).toBeNull()
    })

    test('a part carries its share as a custom property, and its tone', async () => {
      const m = await adapter.share({ items: day }, freshTarget())
      const segments = parts(m.root, 'share', 'segment')
      expect(segments.map((segment) => segment.style.getPropertyValue('--gg-share').trim())).toEqual(['92', '6', '2'])
      expect(segments.map((segment) => segment.dataset.tone)).toEqual(['ok', 'error', 'neutral'])
      expect(segments.every((segment) => segment.dataset.series === undefined)).toBe(true)
    })

    test('a category takes a series instead, and never both', async () => {
      const m = await adapter.share(
        { items: [{ label: 'TypeScript', value: 3, series: 2 }, { label: 'CSS', value: 1, series: 5 }] },
        freshTarget()
      )
      const segments = parts(m.root, 'share', 'segment')
      expect(segments.map((segment) => segment.dataset.series)).toEqual(['2', '5'])
      expect(segments.every((segment) => segment.dataset.tone === undefined)).toBe(true)
    })

    test('follows new numbers, and drops a part that falls to nothing', async () => {
      const m = await adapter.share({ items: day, unit: 'h' }, freshTarget())
      await m.update({ items: [{ label: 'up', value: 24, tone: 'ok' as const }], unit: 'h' })
      const segments = parts(m.root, 'share', 'segment')
      expect(segments).toHaveLength(1)
      expect(segments[0].style.getPropertyValue('--gg-share').trim()).toBe('100')
      expect(part(m.root, 'share', 'root')!.getAttribute('aria-label')).toBe('24 h up')
    })

    test('an empty bar keeps its name and draws nothing', async () => {
      const m = await adapter.share({ items: [], words: { empty: 'No checks yet' } }, freshTarget())
      expect(part(m.root, 'share', 'root')!.getAttribute('aria-label')).toBe('No checks yet')
      expect(parts(m.root, 'share', 'segment')).toHaveLength(0)
    })
  })
}
