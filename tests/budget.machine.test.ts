import { describe, expect, it } from 'vitest'
import { connect, exhaustion } from '../packages/core/src/components/budget'

/** A budget has no state: the contract is the forecast, and the meter it hands on. */
const same = (p: Record<string, unknown>) => p

const tokens = { value: 184_200, max: 250_000, label: 'Tokens', locale: 'en-GB' }

describe('the forecast of exhaustion', () => {
  it('is coarse on purpose: one rate is an estimate, not a stopwatch', () => {
    expect(exhaustion(4)).toEqual({ value: 5, unit: 'second' })
    expect(exhaustion(47)).toEqual({ value: 45, unit: 'second' })
    expect(exhaustion(89)).toEqual({ value: 90, unit: 'second' })
    expect(exhaustion(90)).toEqual({ value: 2, unit: 'minute' })
    expect(exhaustion(12 * 60 + 20)).toEqual({ value: 12, unit: 'minute' })
    expect(exhaustion(90 * 60)).toEqual({ value: 2, unit: 'hour' })
    expect(exhaustion(47 * 3600)).toEqual({ value: 47, unit: 'hour' })
    expect(exhaustion(72 * 3600)).toEqual({ value: 3, unit: 'day' })
  })
})

describe('budget', () => {
  it('hands the bar to a meter rather than drawing a second one', () => {
    const api = connect({ ...tokens, rate: 90, tone: 'warn', size: 'lg' }, same)
    expect(api.meterProps).toMatchObject({ value: 184_200, max: 250_000, label: 'Tokens', tone: 'warn', size: 'lg', locale: 'en-GB' })
    expect(api.remaining).toBe(65_800)
    expect(api.rootProps).toEqual({ 'data-scope': 'budget', 'data-part': 'root', 'data-tone': 'warn' })
  })

  it('the reading is the meter’s, and the budget’s words reach it', () => {
    const api = connect({ ...tokens, rate: 1 }, same, { words: { reading: (value, max) => `${value} из ${max}` } })
    expect(api.meterProps.words?.reading?.('184 200', '250 000')).toBe('184 200 из 250 000')
  })

  it('says when the limit will be reached, at the pace it is being spent', () => {
    expect(connect({ ...tokens, rate: 90 }, same).secondsLeft).toBeCloseTo(731.1, 1)
    expect(connect({ ...tokens, rate: 90 }, same).note).toBe('At the current pace the limit will be reached in 12 minutes')
    expect(connect({ ...tokens, rate: 20_000 }, same).note).toBe('At the current pace the limit will be reached in 5 seconds')
  })

  it('nothing is being spent: the limit will not be reached, and it says so', () => {
    const api = connect({ ...tokens, rate: 0 }, same)
    expect(api.secondsLeft).toBeNull()
    expect(api.note).toBe('Nothing is being spent now, so the limit will not be reached')
  })

  it('with no rate there is no forecast — which is to say there is no budget, only a meter', () => {
    const api = connect(tokens, same)
    expect(api.note).toBeUndefined()
    expect(api.secondsLeft).toBeNull()
  })

  it('spent is spent: the forecast stops forecasting', () => {
    expect(connect({ ...tokens, value: 250_000, rate: 90 }, same).note).toBe('The limit is spent')
    expect(connect({ ...tokens, value: 310_000, rate: 90 }, same).note).toBe('The limit is spent')
    // The meter keeps the number it was given and reads it as over; the drawing clamps.
    expect(connect({ ...tokens, value: 310_000 }, same).meterProps.value).toBe(310_000)
    expect(connect({ ...tokens, value: 310_000 }, same).remaining).toBe(0)
  })

  it('the forecast lives in a polite live region — the cadence is the application’s', () => {
    expect(connect({ ...tokens, rate: 90 }, same).noteProps).toEqual({
      'data-scope': 'budget',
      'data-part': 'note',
      role: 'status',
      'aria-live': 'polite',
    })
  })

  it('takes words of its own, and the figures are the locale’s', () => {
    const api = connect({ ...tokens, rate: 90, locale: 'de-DE' }, same, { words: { forecast: (when) => `Limit erreicht ${when}` } })
    expect(api.note).toBe('Limit erreicht in 12 Minuten')
  })

  it('a ceiling of nothing is not a ceiling, and nonsense does not reach the meter', () => {
    const api = connect({ value: Number.NaN, max: Number.NaN, label: 'Cost' }, same)
    expect(api.meterProps).toMatchObject({ value: 0, max: 0 })
    expect(api.remaining).toBe(0)
  })
})
