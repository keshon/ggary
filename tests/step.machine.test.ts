import { describe, expect, it } from 'vitest'
import { connect, STEP_TONES, stepDuration, STEP_WORDS, type StepState } from '../packages/core/src/components/step'

/** A step has no state of its own: the `<details>` keeps the one there is. */
const same = (p: Record<string, unknown>) => p

const call = { name: 'read_file', argument: 'terrain/heightmap.ts' }
const all: StepState[] = ['running', 'ok', 'failed']

describe('step', () => {
  it('carries the phase as data and the colour as a tone, and never the other way about', () => {
    expect(all.map((state) => connect({ ...call, state }, same).rootProps['data-tone'])).toEqual(['running', 'ok', 'error'])
    expect(all.map((state) => connect({ ...call, state }, same).rootProps['data-state'])).toEqual(all)
    expect(STEP_TONES).toEqual({ running: 'running', ok: 'ok', failed: 'error' })
  })

  it('a call that has not begun has no state, and is neutral', () => {
    const api = connect(call, same)
    expect(api.rootProps['data-state']).toBeUndefined()
    expect(api.rootProps['data-tone']).toBe('neutral')
    expect(api.status).toBe(STEP_WORDS.pending)
  })

  it('says the phase in words as well as in colour', () => {
    expect(all.map((state) => connect({ ...call, state }, same).status)).toEqual(['Running', 'Succeeded', 'Failed'])
    expect(connect({ ...call, state: 'failed' }, same, { words: { failed: 'Не удалось' } }).status).toBe('Не удалось')
  })

  it('draws no dot of its own: the kit’s dot reads the tone from the root', () => {
    expect(Object.keys(connect(call, same)).filter((key) => key.toLowerCase().includes('dot'))).toEqual([])
  })

  describe('the time', () => {
    it('is one unit, never two added up', () => {
      expect(stepDuration(38, 'en-GB', STEP_WORDS)).toBe('38 ms')
      expect(stepDuration(999, 'en-GB', STEP_WORDS)).toBe('999 ms')
      expect(stepDuration(1000, 'en-GB', STEP_WORDS)).toBe('1.0 s')
      expect(stepDuration(14_040, 'en-GB', STEP_WORDS)).toBe('14.0 s')
      expect(stepDuration(60_000, 'en-GB', STEP_WORDS)).toBe('1 m 00 s')
      expect(stepDuration(125_400, 'en-GB', STEP_WORDS)).toBe('2 m 05 s')
    })

    it('is padded above a minute, so a column of times stays a column', () => {
      expect(stepDuration(125_400, 'en-GB', STEP_WORDS)).toMatch(/ 05 s$/)
    })

    it('is formatted in the page’s locale', () => {
      expect(stepDuration(1400, 'de-DE', STEP_WORDS)).toBe('1,4 s')
    })

    it('a time that is not one is left out rather than guessed at', () => {
      expect(stepDuration(Number.NaN, undefined, STEP_WORDS)).toBeUndefined()
      expect(stepDuration(-1, undefined, STEP_WORDS)).toBeUndefined()
      expect(connect(call, same).meta).toBe('')
    })
  })

  it('puts the volume before the time, in one line', () => {
    expect(connect({ ...call, detail: '240 lines', duration: 1400, locale: 'en-GB' }, same).meta).toBe('240 lines · 1.4 s')
    expect(connect({ ...call, detail: '240 lines' }, same).meta).toBe('240 lines')
    expect(connect({ ...call, duration: 400, locale: 'en-GB' }, same).meta).toBe('400 ms')
  })

  describe('the folded output', () => {
    it('names its number in words rather than trailing off', () => {
      const api = connect({ ...call, outputLines: 240, locale: 'en-GB' }, same)
      expect(api.truncated).toBe(true)
      expect(api.showAllLabel).toBe('Show all 240 lines')
      expect(api.outputProps['data-truncated']).toBe('true')
    })

    it('a number is formatted, so nobody reads 12000 as twelve', () => {
      expect(connect({ ...call, outputLines: 12_000, locale: 'en-GB' }, same).showAllLabel).toBe('Show all 12,000 lines')
    })

    it('with nothing hidden there is no button and no claim of truncation', () => {
      const api = connect(call, same)
      expect(api.truncated).toBe(false)
      expect(api.showAllLabel).toBe('')
      expect(api.outputProps['data-truncated']).toBeUndefined()
    })

    it('the press is the application’s: the step only offers it', () => {
      let asked = 0
      const api = connect({ ...call, outputLines: 9, onShowAll: () => (asked += 1) }, same)
      expect(api.moreProps.type).toBe('button')
      ;(api.moreProps.onClick as () => void)()
      expect(asked).toBe(1)
    })
  })

  it('is busy while it runs, or while its output is still arriving', () => {
    expect(connect({ ...call, state: 'running' }, same).rootProps['aria-busy']).toBe('true')
    expect(connect({ ...call, streaming: true }, same).rootProps['aria-busy']).toBe('true')
    expect(connect({ ...call, state: 'ok' }, same).rootProps['aria-busy']).toBeUndefined()
    expect(connect({ ...call, streaming: true }, same).showCaret).toBe(true)
    expect(connect(call, same).showCaret).toBe(false)
  })

  it('opens once and then leaves the element alone', () => {
    expect(connect({ ...call, defaultOpen: true }, same).rootProps.open).toBe(true)
    expect(connect(call, same).rootProps.open).toBeUndefined()
    expect(connect({ ...call, defaultOpen: false }, same).rootProps.open).toBeUndefined()
  })

  it('reports what the reader did with it', () => {
    const seen: boolean[] = []
    const api = connect({ ...call, onOpenChange: (open) => seen.push(open) }, same)
    ;(api.rootProps.onToggle as (event: Event) => void)({ currentTarget: { open: true } } as unknown as Event)
    expect(seen).toEqual([true])
    expect(connect(call, same).rootProps.onToggle).toBeUndefined()
  })

  it('keeps the whole argument in a title: the line shows only what fits', () => {
    expect(connect(call, same).argumentProps.title).toBe('terrain/heightmap.ts')
  })

  it('names a glyph the icon set has, and draws none itself', () => {
    const api = connect(call, same)
    expect(api.indicatorProps['data-icon']).toBe('chevron-right')
    expect(api.indicatorProps['aria-hidden']).toBe('true')
  })
})
