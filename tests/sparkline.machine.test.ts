import { describe, expect, it } from 'vitest'
import { connect, sparklineGeometry, SPARKLINE_DOT_RADIUS, SPARKLINE_VIEWBOX } from '../packages/core/src/components/sparkline'

/** A sparkline has no state: the contract is the geometry and the prop bags. */
const same = (p: Record<string, unknown>) => p

const rising = [0, 5, 10]

describe('sparkline geometry', () => {
  it('spreads the values across the viewBox, top to bottom', () => {
    const { points, linePath, min, max } = sparklineGeometry(rising)
    expect(points).toEqual([
      { x: 0, y: 32 },
      { x: 60, y: 16 },
      { x: 120, y: 0 },
    ])
    // The highest value is at the TOP: y counts down the screen.
    expect(linePath).toBe('M0,32 60,16 120,0')
    expect([min, max]).toEqual([0, 10])
  })

  it('closes the area down to the bottom edge and back to the first x', () => {
    const { areaPath } = sparklineGeometry(rising)
    expect(areaPath).toBe(`M0,32 60,16 120,0 120,${SPARKLINE_VIEWBOX.height} 0,${SPARKLINE_VIEWBOX.height}Z`)
  })

  it('a flat series is still a line: the middle, not a division by zero', () => {
    const { points, linePath, empty } = sparklineGeometry([7, 7, 7])
    expect(empty).toBe(false)
    expect(points.every((point) => point.y === 16)).toBe(true)
    expect(linePath).toBe('M0,16 60,16 120,16')
    expect(linePath).not.toMatch(/NaN/)
  })

  it('one value, none, or one that is not a number draws nothing and does not throw', () => {
    for (const values of [[], [42], [1, Number.NaN, 3], [1, Number.POSITIVE_INFINITY]]) {
      const geometry = sparklineGeometry(values)
      expect(geometry.empty).toBe(true)
      expect(geometry.linePath).toBe('')
      expect(geometry.areaPath).toBe('')
      expect(geometry.lastPoint).toBeNull()
    }
  })

  it('negative values and a descent are read the same way', () => {
    const { points, lastPoint } = sparklineGeometry([-10, 0, -5])
    expect(points[0]).toEqual({ x: 0, y: 32 })
    expect(points[1]).toEqual({ x: 60, y: 0 })
    expect(lastPoint).toEqual({ x: 120, y: 16 })
  })

  it('rounds to a tenth of a viewBox unit rather than carrying a float', () => {
    const { linePath } = sparklineGeometry([0, 1, 2, 4, 8, 9, 3])
    expect(linePath).not.toMatch(/\d\.\d{3}/)
  })
})

describe('sparkline', () => {
  it('names its parts and hands the paths to the adapters', () => {
    const api = connect({ values: rising, area: true }, same)
    expect(api.rootProps['data-scope']).toBe('sparkline')
    expect(api.rootProps.viewBox).toBe('0 0 120 32')
    expect(api.rootProps.preserveAspectRatio).toBe('none')
    expect(api.areaProps).toMatchObject({ 'data-part': 'area', d: api.areaPath })
    expect(api.lineProps).toMatchObject({ 'data-part': 'line', d: api.linePath })
    expect(api.lastProps).toMatchObject({ 'data-part': 'last', cx: 120, cy: 0, r: SPARKLINE_DOT_RADIUS })
  })

  it('draws the fill only when asked, and the dot unless refused', () => {
    expect(connect({ values: rising }, same).showArea).toBe(false)
    expect(connect({ values: rising, area: true }, same).showArea).toBe(true)
    expect(connect({ values: rising }, same).showLast).toBe(true)
    expect(connect({ values: rising, last: false }, same).showLast).toBe(false)
    // Nothing to draw, nothing drawn, whatever was asked for.
    const none = connect({ values: [3], area: true }, same)
    expect([none.showArea, none.showLast, none.empty]).toEqual([false, false, true])
    expect(none.rootProps['data-empty']).toBe('')
  })

  it('carries the series as data, and no series at all where there is one line', () => {
    expect(connect({ values: rising, series: 3 }, same).rootProps['data-series']).toBe('3')
    expect(connect({ values: rising }, same).rootProps['data-series']).toBeUndefined()
    // Seven is not one of six: the picture falls back to the accent rather than inventing a hue.
    expect(connect({ values: rising, series: 7 as 6 }, same).rootProps['data-series']).toBeUndefined()
  })

  it('is a picture with a name: the reading in words, in the locale’s numbers', () => {
    const api = connect({ values: [31000, 35000, 42000], locale: 'en-US' }, same)
    expect(api.rootProps.role).toBe('img')
    expect(api.rootProps['aria-label']).toBe('42,000, up from 31,000')
    expect(api.rootProps['aria-hidden']).toBeUndefined()
    expect(connect({ values: [42, 31], locale: 'en-US' }, same).label).toBe('31, down from 42')
    expect(connect({ values: [7, 7], locale: 'en-US' }, same).label).toBe('7, level from 7')
    expect(connect({ values: [31000, 42000], locale: 'de-DE' }, same).label).toBe('42.000, up from 31.000')
  })

  it('takes the author’s label, and other words for the default', () => {
    expect(connect({ values: rising, label: '42 runs, up from 31' }, same).rootProps['aria-label']).toBe('42 runs, up from 31')
    const words = { reading: (first: string, last: string) => `с ${first} до ${last}`, empty: 'Нет данных' }
    expect(connect({ values: [1, 2] }, same, { words }).label).toBe('с 1 до 2')
    expect(connect({ values: [] }, same, { words }).label).toBe('Нет данных')
  })

  it('with nothing to draw it still says so, and a label still wins', () => {
    expect(connect({ values: [] }, same).rootProps['aria-label']).toBe('No data')
    expect(connect({ values: [], label: 'Runs per day' }, same).rootProps['aria-label']).toBe('Runs per day')
  })

  it('describe: false hides the picture instead of naming it — the number beside it speaks', () => {
    const api = connect({ values: rising, describe: false }, same)
    expect(api.rootProps['aria-hidden']).toBe('true')
    expect(api.rootProps.role).toBeUndefined()
    expect(api.rootProps['aria-label']).toBeUndefined()
  })

  it('says which way it went, level included', () => {
    expect(connect({ values: [1, 9] }, same).direction).toBe('up')
    expect(connect({ values: [9, 1] }, same).direction).toBe('down')
    expect(connect({ values: [9, 1, 9] }, same).direction).toBe('level')
    expect(connect({ values: [] }, same).direction).toBe('level')
  })
})
