import { describe, expect, it } from 'vitest'
import { connect, connectRow, metricValueText } from '../packages/core/src/components/metric'

/** A metric has no state: the contract is the prop bags. */
const same = (p: Record<string, unknown>) => p

describe('metric', () => {
  it('names its parts, and carries no role: it is read in the order it is written', () => {
    const api = connect({ label: 'Runs per day', value: 128 }, same)
    expect(api.rootProps).toEqual({ 'data-scope': 'metric', 'data-part': 'root' })
    expect(api.labelProps['data-part']).toBe('label')
    expect(api.valueProps['data-part']).toBe('value')
    expect(api.unitProps['data-part']).toBe('unit')
    expect(api.rootProps.role).toBeUndefined()
    expect(api.rootProps.tabIndex).toBeUndefined()
  })

  it('writes a number in the locale’s form and a string as given', () => {
    expect(connect({ label: 'Rows', value: 1234567.5, locale: 'en-US' }, same).valueText).toBe('1,234,567.5')
    expect(connect({ label: 'Rows', value: 1234567.5, locale: 'de-DE' }, same).valueText).toBe('1.234.567,5')
    expect(connect({ label: 'Duration p95', value: '4:12' }, same).valueText).toBe('4:12')
    expect(metricValueText(0, 'en-US')).toBe('0')
  })

  it('shows a unit only when there is one', () => {
    expect(connect({ label: 'Average time', value: 4.2, unit: 's' }, same).showUnit).toBe(true)
    expect(connect({ label: 'Average time', value: 4.2 }, same).showUnit).toBe(false)
    expect(connect({ label: 'Average time', value: 4.2, unit: '' }, same).showUnit).toBe(false)
  })

  it('keeps direction and judgement apart: time down is good, warnings up are bad', () => {
    const time = connect({ label: 'Run time', value: 42, delta: '18% down on the last', direction: 'down', tone: 'ok' }, same)
    expect(time.deltaProps['data-dir']).toBe('down')
    expect(time.deltaProps['data-tone']).toBe('ok')
    expect(time.deltaIconProps['data-icon']).toBe('arrow-down')

    const warnings = connect({ label: 'Warnings', value: 12, delta: '5 new', direction: 'up', tone: 'error' }, same)
    expect(warnings.deltaProps['data-dir']).toBe('up')
    expect(warnings.deltaProps['data-tone']).toBe('error')
    expect(warnings.deltaIconProps['data-icon']).toBe('arrow-up')
  })

  it('the arrow is hidden from assistive tech: the words carry the sign', () => {
    const api = connect({ label: 'Warnings', value: 12, delta: '5 new', direction: 'up' }, same)
    expect(api.deltaIconProps['aria-hidden']).toBe('true')
    expect(api.deltaIconProps['data-part']).toBe('delta-icon')
  })

  it('a delta without a direction has no arrow, without a tone no tone', () => {
    const api = connect({ label: 'Bundle size', value: 7.4, delta: 'unchanged' }, same)
    expect(api.showDelta).toBe(true)
    expect(api.showDeltaIcon).toBe(false)
    expect(api.deltaProps['data-dir']).toBeUndefined()
    expect(api.deltaProps['data-tone']).toBeUndefined()
  })

  it('no delta, no arrow, whatever the direction says', () => {
    const api = connect({ label: 'Warnings', value: 12, direction: 'up', tone: 'error' }, same)
    expect(api.showDelta).toBe(false)
    expect(api.showDeltaIcon).toBe(false)
    expect(connect({ label: 'Warnings', value: 12, delta: '' }, same).showDelta).toBe(false)
  })
})

describe('metric row', () => {
  it('is tiles by default: neither joined nor a headline', () => {
    const api = connectRow({}, same)
    expect(api.rootProps).toEqual({ 'data-scope': 'metric-row', 'data-part': 'root', 'data-joined': undefined, 'data-headline': undefined })
  })

  it('joined and headline are presence attributes, independent of each other', () => {
    expect(connectRow({ joined: true }, same).rootProps['data-joined']).toBe('')
    expect(connectRow({ joined: true }, same).rootProps['data-headline']).toBeUndefined()
    const band = connectRow({ joined: true, headline: true }, same).rootProps
    expect(band['data-joined']).toBe('')
    expect(band['data-headline']).toBe('')
  })
})
