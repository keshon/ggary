import { describe, expect, it } from 'vitest'
import { connect, sharePercents } from '../packages/core/src/components/share'

/** A share bar has no state: the contract is the percentages and the prop bags. */
const same = (p: Record<string, unknown>) => p

const day = [
  { label: 'up', value: 22, tone: 'ok' as const },
  { label: 'down', value: 1.5, tone: 'error' as const },
  { label: 'unknown', value: 0.5, tone: 'neutral' as const },
]

const shares = (items: { label: string; value: number }[]) =>
  connect({ items }, same).segments.map((segment) => segment.segmentProps.style as Record<string, number>)

describe('share percentages', () => {
  it('divides the whole, and the parts total 100 however the numbers fall', () => {
    expect(sharePercents([22, 1.5, 0.5])).toEqual([92, 6, 2])
    expect(sharePercents([1, 1, 1])).toEqual([34, 33, 33])
    expect(sharePercents([1, 1, 1, 1, 1, 1, 1])).toEqual([15, 15, 14, 14, 14, 14, 14])
    for (const values of [[7, 11, 13], [1, 2, 3, 4, 5, 6], [999, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1]]) {
      expect(sharePercents(values).reduce((sum, value) => sum + value, 0)).toBe(100)
    }
  })

  it('the points left over go to the largest remainders, earliest first', () => {
    // Three thirds: 33.33 each, one point over, and the first part takes it.
    expect(sharePercents([1, 1, 1])).toEqual([34, 33, 33])
    expect(sharePercents([10, 10, 11])).toEqual([32, 32, 36])
  })

  it('a part with a value never falls to nothing: it takes a point from the largest', () => {
    expect(sharePercents([10_000, 1])).toEqual([99, 1])
    expect(sharePercents([100_000, 1, 1])).toEqual([98, 1, 1])
    // And a part with no value stays at nothing, however small the rest are.
    expect(sharePercents([10_000, 0, 1])).toEqual([99, 0, 1])
  })

  it('nothing at all is nothing: no part is drawn and the bar is bare track', () => {
    expect(sharePercents([])).toEqual([])
    expect(sharePercents([0, 0])).toEqual([0, 0])
    expect(sharePercents([-4, Number.NaN, Number.POSITIVE_INFINITY])).toEqual([0, 0, 0])
  })
})

describe('share', () => {
  it('is one picture with one name: the reading in words, built from the items', () => {
    const api = connect({ items: day, unit: 'h', locale: 'en-GB' }, same)
    expect(api.rootProps).toMatchObject({ 'data-scope': 'share', 'data-part': 'root', role: 'img', 'data-size': 'md' })
    expect(api.rootProps['aria-label']).toBe('22 h up, 1.5 h down, 0.5 h unknown')
    expect(api.label).toBe(api.rootProps['aria-label'])
  })

  it('the label stands before the reading, and the numbers are the locale’s', () => {
    const api = connect({ items: [{ label: 'up', value: 1234.5 }], label: 'The last 24 hours', locale: 'de-DE' }, same)
    expect(api.rootProps['aria-label']).toBe('The last 24 hours: 1.234,5 up')
  })

  it('takes words of its own: another language joins its parts differently', () => {
    const api = connect(
      { items: day, unit: 'ч', locale: 'ru-RU', label: 'Сутки' },
      same,
      { words: { part: (value, label, unit) => `${label} — ${value} ${unit}`, separator: '; ', labelSeparator: ' — ' } })
    expect(api.rootProps['aria-label']).toBe('Сутки — up — 22 ч; down — 1,5 ч; unknown — 0,5 ч')
  })

  it('a segment carries its share as data, and its colour from a tone or a series', () => {
    const api = connect({ items: day }, same)
    expect(api.segments).toHaveLength(3)
    expect(api.segments[0].segmentProps).toMatchObject({
      'data-scope': 'share',
      'data-part': 'segment',
      'data-tone': 'ok',
      style: { '--gg-share': 92 },
    })
    expect(api.segments[0].segmentProps['data-series']).toBeUndefined()

    const languages = connect({ items: [{ label: 'TypeScript', value: 3, series: 2 as const }, { label: 'CSS', value: 1, series: 5 as const }] }, same)
    expect(languages.segments.map((s) => s.segmentProps['data-series'])).toEqual([2, 5])
    expect(languages.segments.map((s) => s.segmentProps['data-tone'])).toEqual([undefined, undefined])
  })

  it('a judgement outranks a category: never both colours on one part', () => {
    const api = connect({ items: [{ label: 'failed', value: 1, tone: 'error' as const, series: 3 as const }] }, same)
    expect(api.segments[0].segmentProps['data-tone']).toBe('error')
    expect(api.segments[0].segmentProps['data-series']).toBeUndefined()
  })

  it('draws only the parts with a share, and still says the others', () => {
    const api = connect({ items: [{ label: 'up', value: 24 }, { label: 'down', value: 0 }], unit: 'h' }, same)
    expect(api.segments.map((s) => s.item.label)).toEqual(['up'])
    expect(api.rootProps['aria-label']).toBe('24 h up, 0 h down')
    expect(shares([{ label: 'up', value: 24 }])).toEqual([{ '--gg-share': 100 }])
  })

  it('an empty bar is named, not silent', () => {
    const api = connect({ items: [] }, same)
    expect(api.segments).toEqual([])
    expect(api.rootProps['aria-label']).toBe('Nothing yet')
    expect(connect({ items: [] }, same, { words: { empty: 'No checks yet' } }).rootProps['aria-label']).toBe('No checks yet')
  })

  it('is the meter’s height unless it is the subject of the screen', () => {
    expect(connect({ items: day, size: 'lg' }, same).rootProps['data-size']).toBe('lg')
  })
})
