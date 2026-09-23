import { describe, expect, it } from 'vitest'
import { connect, type MeterProps } from '../packages/core/src/components/meter'

/** A meter has no state: the contract is the prop bags and the reading. */
const same = (p: Record<string, unknown>) => p
const meter = (props: MeterProps) => connect({ id: 'm', ...props }, same)

describe('meter', () => {
  it('names its parts and puts the reading on the track, not the root', () => {
    const api = meter({ value: 18, max: 60, label: 'Render' })
    expect(api.rootProps['data-scope']).toBe('meter')
    expect(api.rootProps['data-part']).toBe('root')
    expect(api.rootProps.role).toBeUndefined()
    expect(api.trackProps['data-part']).toBe('track')
    expect(api.fillProps['data-part']).toBe('fill')
    expect(api.valueProps['data-part']).toBe('value')
    expect(api.trackProps.role).toBe('meter')
  })

  it('reports the range, the value and the reading in words to assistive tech', () => {
    const api = meter({ value: 18, max: 60, label: 'Render', locale: 'en-GB' })
    expect(api.trackProps['aria-valuemin']).toBe(0)
    expect(api.trackProps['aria-valuemax']).toBe(60)
    expect(api.trackProps['aria-valuenow']).toBe(18)
    expect(api.trackProps['aria-valuetext']).toBe('18 of 60')
    expect(api.valueText).toBe('18 of 60')
    expect(api.fraction).toBeCloseTo(0.3)
    expect(api.trackProps.style).toEqual({ '--gg-meter': 0.3 })
  })

  it('measures against 100 when no ceiling is given, so a bare value is a percentage', () => {
    const api = meter({ value: 43, locale: 'en-GB' })
    expect(api.trackProps['aria-valuemax']).toBe(100)
    expect(api.valueText).toBe('43 of 100')
    expect(api.fraction).toBeCloseTo(0.43)
  })

  // The figures follow the locale; the joining word is the default words', which
  // a page writing in another language replaces through `words`.
  it('writes the figures in the locale', () => {
    expect(meter({ value: 184320, max: 250000, locale: 'en-GB' }).valueText).toBe('184,320 of 250,000')
    expect(meter({ value: 184320, max: 250000, locale: 'de-DE' }).valueText).toBe('184.320 of 250.000')
  })

  it('over the maximum it clamps the drawing and says so in the words', () => {
    const api = meter({ value: 72, max: 60, label: 'Spending', locale: 'en-GB' })
    expect(api.over).toBe(true)
    expect(api.fraction).toBe(1)
    // The picture clamps; the reading keeps the number that was given.
    expect(api.trackProps['aria-valuenow']).toBe(60)
    expect(api.trackProps['aria-valuetext']).toBe('72 of 60, over the maximum')
    expect(api.rootProps['data-state']).toBe('over')
    expect(api.trackProps['data-state']).toBe('over')
    expect(api.fillProps['data-state']).toBe('over')
  })

  it('under nothing it reads empty, and a ceiling of nothing is not divided by', () => {
    expect(meter({ value: -5, max: 60 }).fraction).toBe(0)
    expect(meter({ value: -5, max: 60 }).trackProps['aria-valuenow']).toBe(0)
    expect(meter({ value: 5, max: 0 }).fraction).toBe(0)
    expect(meter({ value: Number.NaN, max: 60 }).fraction).toBe(0)
  })

  it('a visible label names the track by id; a hidden one names it in words', () => {
    const shown = meter({ value: 4, label: 'Render' })
    expect(shown.showLabel).toBe(true)
    expect(shown.labelProps.id).toBe('m-label')
    expect(shown.trackProps['aria-labelledby']).toBe('m-label')
    expect(shown.trackProps['aria-label']).toBeUndefined()

    const hidden = meter({ value: 4, label: 'Render', hideLabel: true })
    expect(hidden.showLabel).toBe(false)
    expect(hidden.trackProps['aria-label']).toBe('Render')
    expect(hidden.trackProps['aria-labelledby']).toBeUndefined()
  })

  it('the reading is shown by default and hidden from a reader, which hears it once from the track', () => {
    expect(meter({ value: 4 }).showValue).toBe(true)
    expect(meter({ value: 4, showValue: false }).showValue).toBe(false)
    expect(meter({ value: 4 }).valueProps['aria-hidden']).toBe('true')
  })

  it('takes the reading in words as given, over the ceiling as well', () => {
    expect(meter({ value: 18, max: 60, valueText: '18.2 s' }).valueText).toBe('18.2 s')
    expect(meter({ value: 72, max: 60, valueText: '18.2 s' }).trackProps['aria-valuetext']).toBe('18.2 s')
  })

  it('says the reading in other words on request', () => {
    const api = meter({
      value: 18,
      max: 60,
      locale: 'en-GB',
      words: { reading: (value, max) => `${value} из ${max}` },
    })
    expect(api.valueText).toBe('18 из 60')
    // The word it was not given keeps the default.
    expect(meter({ value: 72, max: 60, words: { reading: (v) => v } }).valueText).toBe('72 of 60, over the maximum')
  })

  it('carries the tone and the size as attributes, and nothing of a series', () => {
    const api = meter({ value: 4, tone: 'warn', size: 'lg' })
    expect(api.rootProps['data-tone']).toBe('warn')
    expect(api.rootProps['data-size']).toBe('lg')
    expect(api.rootProps['data-series']).toBeUndefined()
    expect(meter({ value: 4 }).rootProps['data-tone']).toBeUndefined()
    expect(meter({ value: 4 }).rootProps['data-size']).toBe('md')
  })
})
