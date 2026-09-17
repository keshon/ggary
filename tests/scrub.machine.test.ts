import { describe, expect, it } from 'vitest'
import { SCRUB_PIXELS_PER_STEP, scrubValue } from '../packages/core/src/utils/scrub'

/**
 * The arithmetic of dragging an axis letter, with no DOM: what a pixel is worth,
 * what the modifiers do, and where the float tail is cut.
 */
describe('scrub', () => {
  const base = { start: 10, step: 1 }

  it('turns pixels into steps, two pixels apiece, in both directions', () => {
    expect(SCRUB_PIXELS_PER_STEP).toBe(2)
    expect(scrubValue({ ...base, dx: 20 })).toBe(20)
    expect(scrubValue({ ...base, dx: -20 })).toBe(0)
    // Less than one notch is no movement at all.
    expect(scrubValue({ ...base, dx: 1 })).toBe(10)
    expect(scrubValue({ ...base, dx: -1 })).toBe(10)
  })

  it('takes the step from the field, and the multiplier from the modifiers', () => {
    expect(scrubValue({ start: 0, step: 5, dx: 20 })).toBe(50)
    expect(scrubValue({ ...base, dx: 20, shiftKey: true })).toBe(110)
    expect(scrubValue({ ...base, dx: 20, altKey: true })).toBe(11)
    // Shift wins when both are held: the coarse gesture is the deliberate one.
    expect(scrubValue({ ...base, dx: 20, shiftKey: true, altKey: true })).toBe(110)
  })

  it('cuts the float tail at the precision the step and the modifier allow', () => {
    expect(scrubValue({ start: 0.1, step: 0.2, dx: 2 })).toBe(0.3)
    expect(scrubValue({ start: 0, step: 0.1, dx: 6, altKey: true })).toBe(0.03)
    expect(scrubValue({ start: 0, step: 1e-2, dx: 2 })).toBe(0.01)
  })

  it('stays within the bounds, and ignores one that is not a number', () => {
    expect(scrubValue({ ...base, dx: 200, max: 12 })).toBe(12)
    expect(scrubValue({ ...base, dx: -200, min: 4 })).toBe(4)
    expect(scrubValue({ ...base, dx: 200, max: Number.NaN })).toBe(110)
  })
})
