import { describe, expect, it } from 'vitest'
import { RING_BOX, RING_CIRCUMFERENCE, connect, type RingProps } from '../packages/core/src/components/ring'

/** A ring has no state either: the contract is the prop bags and the geometry. */
const same = (p: Record<string, unknown>) => p
const ring = (props: RingProps) => connect(props, same)

describe('ring', () => {
  it('names its parts and carries the reading on the svg itself', () => {
    const api = ring({ value: 18, max: 60, label: '30% of the budget spent' })
    expect(api.rootProps['data-scope']).toBe('ring')
    expect(api.rootProps['data-part']).toBe('root')
    expect(api.rootProps.role).toBe('meter')
    expect(api.rootProps['aria-label']).toBe('30% of the budget spent')
    expect(api.trackProps['data-part']).toBe('track')
    expect(api.arcProps['data-part']).toBe('arc')
    expect(api.valueProps['data-part']).toBe('value')
  })

  it('reports the range, the value and the reading in words, as a meter does', () => {
    const api = ring({ value: 18, max: 60, label: 'Budget', locale: 'en-GB' })
    expect(api.rootProps['aria-valuemin']).toBe(0)
    expect(api.rootProps['aria-valuemax']).toBe(60)
    expect(api.rootProps['aria-valuenow']).toBe(18)
    expect(api.rootProps['aria-valuetext']).toBe('18 of 60')
  })

  it('draws in a box of 20 at a radius of 8, because the dash is that circumference', () => {
    const api = ring({ value: 50 })
    expect(RING_BOX).toEqual({ size: 20, centre: 10, radius: 8 })
    expect(RING_CIRCUMFERENCE).toBeCloseTo(50.265, 3)
    expect(api.viewBox).toBe('0 0 20 20')
    expect(api.rootProps.viewBox).toBe('0 0 20 20')
    expect(api.trackProps).toMatchObject({ cx: 10, cy: 10, r: 8 })
    expect(api.arcProps).toMatchObject({ cx: 10, cy: 10, r: 8 })
    expect(api.valueProps).toMatchObject({ x: 10, y: 10 })
  })

  it('the whole circle is dashed once and pushed round by the part not filled', () => {
    const empty = ring({ value: 0 }).arcProps.style as Record<string, number>
    const quarter = ring({ value: 25 }).arcProps.style as Record<string, number>
    const full = ring({ value: 100 }).arcProps.style as Record<string, number>
    expect(empty['stroke-dasharray']).toBeCloseTo(RING_CIRCUMFERENCE, 6)
    expect(quarter['stroke-dasharray']).toBeCloseTo(RING_CIRCUMFERENCE, 6)
    // One property moves with the value, and it is the one that can be transitioned.
    expect(empty['stroke-dashoffset']).toBeCloseTo(RING_CIRCUMFERENCE, 6)
    expect(quarter['stroke-dashoffset']).toBeCloseTo(RING_CIRCUMFERENCE * 0.75, 6)
    expect(full['stroke-dashoffset']).toBeCloseTo(0, 6)
  })

  it('over the maximum the arc closes and the words say it ran past', () => {
    const api = ring({ value: 72, max: 60, label: 'Budget', locale: 'en-GB' })
    expect(api.over).toBe(true)
    expect(api.fraction).toBe(1)
    expect((api.arcProps.style as Record<string, number>)['stroke-dashoffset']).toBeCloseTo(0, 6)
    expect(api.rootProps['aria-valuenow']).toBe(60)
    expect(api.rootProps['aria-valuetext']).toBe('72 of 60, over the maximum')
    expect(api.rootProps['data-state']).toBe('over')
    expect(api.arcProps['data-state']).toBe('over')
  })

  it('the figure at the centre is the share, bare, and shown only where it fits', () => {
    expect(ring({ value: 18, max: 60, locale: 'en-GB' }).shareText).toBe('30')
    expect(ring({ value: 72, max: 60 }).shareText).toBe('100')
    expect(ring({ value: 50, size: 'lg' }).showValue).toBe(true)
    expect(ring({ value: 50 }).showValue).toBe(false)
    expect(ring({ value: 50, size: 'sm' }).showValue).toBe(false)
    expect(ring({ value: 50, size: 'sm', showValue: true }).showValue).toBe(true)
    // Shown for the eye only: the svg itself already says the reading in words.
    expect(ring({ value: 50 }).valueProps['aria-hidden']).toBe('true')
  })

  it('a ring that only repeats what stands beside it is hidden, role and values and all', () => {
    const api = ring({ value: 18, max: 60, label: 'Budget', decorative: true })
    expect(api.rootProps['aria-hidden']).toBe('true')
    expect(api.rootProps.role).toBeUndefined()
    expect(api.rootProps['aria-label']).toBeUndefined()
    expect(api.rootProps['aria-valuenow']).toBeUndefined()
    expect(api.rootProps['aria-valuetext']).toBeUndefined()
    // It still draws the same arc.
    expect(api.fraction).toBeCloseTo(0.3)
  })

  it('carries the tone and the size as attributes, and nothing of a series', () => {
    const api = ring({ value: 4, tone: 'error', size: 'lg' })
    expect(api.rootProps['data-tone']).toBe('error')
    expect(api.rootProps['data-size']).toBe('lg')
    expect(api.rootProps['data-series']).toBeUndefined()
    expect(ring({ value: 4 }).rootProps['data-size']).toBe('md')
    expect(ring({ value: 4 }).rootProps['data-tone']).toBeUndefined()
  })

  it('reads the same quantity the meter does: the words and the locale are shared', () => {
    expect(ring({ value: 184320, max: 250000, locale: 'de-DE' }).valueText).toBe('184.320 of 250.000')
    expect(ring({ value: 18, max: 60, words: { reading: (v, m) => `${v}/${m}` } }).valueText).toBe('18/60')
    expect(ring({ value: 18, max: 60, valueText: '18.2 s' }).rootProps['aria-valuetext']).toBe('18.2 s')
  })
})
