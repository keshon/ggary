import { describe, expect, it } from 'vitest'
import { type Adapter, freshTarget, part } from './harness'

/**
 * A meter has no state, so the contract is the markup: the parts a theme
 * paints, the attributes that carry the reading, and what assistive tech is
 * told — which is where the frameworks differ, if anywhere.
 */
export function meterConformance(adapter: Adapter) {
  const mount = adapter.meter
  if (!mount) return

  describe('meter', () => {
    it('is a reading rather than a job: role meter, with its range and its value', async () => {
      const m = await mount({ value: 18, max: 60, label: 'Render', locale: 'en-GB' }, freshTarget())
      const root = part(m.root, 'meter', 'root')!
      const track = part(root, 'meter', 'track')!
      expect(track.getAttribute('role')).toBe('meter')
      expect(track.getAttribute('aria-valuemin')).toBe('0')
      expect(track.getAttribute('aria-valuemax')).toBe('60')
      expect(track.getAttribute('aria-valuenow')).toBe('18')
      expect(track.getAttribute('aria-valuetext')).toBe('18 of 60')
      expect(part(root, 'meter', 'fill')).not.toBeNull()
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('the share is one number on the track, so the theme draws the fill from it', async () => {
      const m = await mount({ value: 18, max: 60, label: 'Render' }, freshTarget())
      const track = part(m.root, 'meter', 'track')!
      expect(track.style.getPropertyValue('--gg-meter')).toBe('0.3')
      await m.update({ value: 45 })
      expect(part(m.root, 'meter', 'track')!.style.getPropertyValue('--gg-meter')).toBe('0.75')
    })

    it('the label names the track, and the reading stands beside it in words', async () => {
      const m = await mount({ value: 18, max: 60, label: 'Render', locale: 'en-GB' }, freshTarget())
      const label = part(m.root, 'meter', 'label')!
      const track = part(m.root, 'meter', 'track')!
      expect(label.textContent).toBe('Render')
      expect(track.getAttribute('aria-labelledby')).toBe(label.id)
      expect(label.id).not.toBe('')
      const value = part(m.root, 'meter', 'value')!
      expect(value.textContent).toBe('18 of 60')
      // Heard once, from the track: the drawn reading repeats it for the eye only.
      expect(value.getAttribute('aria-hidden')).toBe('true')
    })

    it('a hidden label names the track in words instead, and draws nothing', async () => {
      const m = await mount({ value: 18, max: 60, label: 'Render', hideLabel: true }, freshTarget())
      expect(part(m.root, 'meter', 'label')).toBeNull()
      const track = part(m.root, 'meter', 'track')!
      expect(track.getAttribute('aria-label')).toBe('Render')
      expect(track.hasAttribute('aria-labelledby')).toBe(false)
    })

    it('over the maximum it clamps the picture, says so in the words, and marks the state', async () => {
      const m = await mount({ value: 72, max: 60, label: 'Spending', locale: 'en-GB' }, freshTarget())
      const root = part(m.root, 'meter', 'root')!
      const track = part(root, 'meter', 'track')!
      expect(root.dataset.state).toBe('over')
      expect(track.style.getPropertyValue('--gg-meter')).toBe('1')
      expect(track.getAttribute('aria-valuenow')).toBe('60')
      expect(track.getAttribute('aria-valuetext')).toBe('72 of 60, over the maximum')
      await m.update({ value: 30 })
      expect(part(m.root, 'meter', 'root')!.hasAttribute('data-state')).toBe(false)
    })

    it('follows a new tone, and carries no series: one quantity is not a category', async () => {
      const m = await mount({ value: 88, label: 'Spending', tone: 'warn' }, freshTarget())
      const root = () => part(m.root, 'meter', 'root')!
      expect(root().dataset.tone).toBe('warn')
      expect(root().dataset.size).toBe('md')
      expect(root().hasAttribute('data-series')).toBe(false)
      await m.update({ tone: 'error', size: 'lg' })
      expect(root().dataset.tone).toBe('error')
      expect(root().dataset.size).toBe('lg')
    })

    it('shows the reading given in place of the default, and can draw none at all', async () => {
      const m = await mount({ value: 18, max: 60, label: 'Render', valueText: '18.2 s' }, freshTarget())
      expect(part(m.root, 'meter', 'value')!.textContent).toBe('18.2 s')
      expect(part(m.root, 'meter', 'track')!.getAttribute('aria-valuetext')).toBe('18.2 s')
      await m.update({ showValue: false })
      expect(part(m.root, 'meter', 'value')).toBeNull()
      // Taken off the page, the reading is still spoken: it is the track's.
      expect(part(m.root, 'meter', 'track')!.getAttribute('aria-valuetext')).toBe('18.2 s')
    })
  })
}
