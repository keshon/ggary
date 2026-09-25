import { describe, expect, it } from 'vitest'
import { type Adapter, freshTarget, part } from './harness'

/**
 * Icon: an empty element naming its glyph. Decoration unless given a label —
 * then an image, named so — and a glyph the app registered is drawn the same
 * way as one of the kit's.
 */
export function iconConformance(adapter: Adapter) {
  describe('icon', () => {
    const setup = async (props: Parameters<Adapter['icon']>[0]) => {
      const m = await adapter.icon(props, freshTarget())
      return { m, icon: () => part(m.root, 'icon', 'root')! }
    }

    it('is decoration by default: an empty element naming its glyph, hidden from a screen reader', async () => {
      const { m, icon } = await setup({ name: 'download' })
      expect(icon().tagName).toBe('SPAN')
      expect(icon().dataset.icon).toBe('download')
      expect(icon().getAttribute('aria-hidden')).toBe('true')
      expect(icon().hasAttribute('role')).toBe(false)
      expect(icon().childNodes).toHaveLength(0)
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('with a label it is an image, named so, and read', async () => {
      const { icon } = await setup({ name: 'status-warn', label: 'Warning' })
      expect(icon().getAttribute('role')).toBe('img')
      expect(icon().getAttribute('aria-label')).toBe('Warning')
      expect(icon().hasAttribute('aria-hidden')).toBe(false)
    })

    it('takes a size, and an app’s own glyph by name', async () => {
      const { m, icon } = await setup({ name: 'rocket' as never, size: 'lg' })
      expect(icon().dataset.size).toBe('lg')
      expect(icon().dataset.icon).toBe('rocket')
      await m.update({ name: 'check', size: undefined })
      expect(icon().dataset.icon).toBe('check')
      expect(icon().hasAttribute('data-size')).toBe(false)
    })
  })
}
