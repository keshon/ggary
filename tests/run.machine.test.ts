import { describe, expect, it } from 'vitest'
import { connect, type RunUnit } from '../packages/core/src/components/run'

/** A run has no state: the contract is the count, the reading and the prop bags. */
const same = (p: Record<string, unknown>) => p

const phase: RunUnit[] = [
  { tone: 'ok' },
  { tone: 'ok' },
  { tone: 'warn' },
  { tone: 'ok' },
  { tone: 'running' },
  {},
  {},
]

describe('run', () => {
  it('counts what is finished, and a unit with no tone has not begun', () => {
    const api = connect({ units: phase, label: 'Agents finished' }, same)
    expect(api.total).toBe(7)
    expect(api.done).toBe(4)
    expect(api.running).toBe(true)
    expect(api.unitsProps).toMatchObject({
      'data-scope': 'run',
      'data-part': 'units',
      role: 'progressbar',
      'aria-valuemin': 0,
      'aria-valuemax': 7,
      'aria-valuenow': 4,
      'aria-label': 'Agents finished',
    })
  })

  it('a unit that failed is finished: a run that ended does not read as one still going', () => {
    const api = connect({ units: [{ tone: 'ok' }, { tone: 'error' }, { tone: 'warn' }] }, same)
    expect(api.done).toBe(3)
    expect(api.running).toBe(false)
  })

  it('says the failures in words: a picture is never the only carrier', () => {
    expect(connect({ units: phase }, same).valueText).toBe('4 of 7 done, 1 with a remark')
    const broken = connect({ units: [{ tone: 'error' }, { tone: 'error' }, { tone: 'warn' }, {}] }, same)
    expect(broken.valueText).toBe('3 of 4 done, 2 failed, 1 with a remark')
    expect(connect({ units: [{ tone: 'error' }, {}] }, same).valueText).toBe('1 of 2 done, 1 failed')
  })

  it('the reading is spoken with the subject, and drawn without it', () => {
    const api = connect({ units: phase, label: 'Agents finished' }, same)
    expect(api.unitsProps['aria-valuetext']).toBe('Agents finished: 4 of 7 done, 1 with a remark')
    expect(api.valueText).toBe('4 of 7 done, 1 with a remark')
    // With no subject the reading names the strip: "4 of 7" alone is not a message.
    expect(connect({ units: phase }, same).unitsProps['aria-label']).toBe('4 of 7 done, 1 with a remark')
  })

  it('the figures are the locale’s', () => {
    const many = Array.from({ length: 1200 }, (_, i) => (i < 1100 ? { tone: 'ok' as const } : {}))
    expect(connect({ units: many, locale: 'de-DE' }, same).valueText).toBe('1.100 of 1.200 done')
  })

  it('takes words of its own', () => {
    const api = connect({ units: phase }, same, { words: {
      reading: (done, total) => `${done} из ${total}`,
      warned: (count) => `${count} с замечанием`,
      separator: ' · ',
    } })
    expect(api.valueText).toBe('4 из 7 · 1 с замечанием')
  })

  it('every unit is the kit’s own dot, hidden from a reader, carrying its tone', () => {
    const api = connect({ units: [{ tone: 'ok', title: 'analysis:docs-drift' }, {}] }, same)
    expect(api.units[0].dotProps).toEqual({
      'data-scope': 'dot',
      'data-part': 'root',
      'data-tone': 'ok',
      'aria-hidden': 'true',
      title: 'analysis:docs-drift',
    })
    // Not begun: no tone at all, rather than a tone that means "neutral".
    expect(api.units[1].dotProps['data-tone']).toBeUndefined()
    expect(api.units.map((unit) => unit.key)).toEqual(['0', '1'])
  })

  it('the drawn reading can be dropped, and the value part is not read twice', () => {
    expect(connect({ units: phase }, same).showValue).toBe(true)
    expect(connect({ units: phase, showValue: false }, same).showValue).toBe(false)
    expect(connect({ units: phase }, same).valueProps).toMatchObject({ 'data-part': 'value', 'aria-hidden': 'true' })
  })

  it('a run with no units is a run of nothing, and says so rather than dividing by it', () => {
    const api = connect({ units: [] }, same)
    expect(api.valueText).toBe('0 of 0 done')
    expect(api.unitsProps).toMatchObject({ 'aria-valuemax': 0, 'aria-valuenow': 0 })
    expect(api.units).toEqual([])
  })
})
