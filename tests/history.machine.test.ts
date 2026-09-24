import { describe, expect, it } from 'vitest'
import { connect, type HistoryTick } from '../packages/core/src/components/history'

/** A history has no state either: the contract is the reading, the shares and the prop bags. */
const same = (p: Record<string, unknown>) => p

const ok = { tone: 'ok' } as const
const night: HistoryTick[] = [ok, ok, { tone: 'error' }, ok, ok, ok, { tone: 'warn' }, ok]

describe('history', () => {
  it('is one picture with one name: the outcomes in words', () => {
    const api = connect({ ticks: night }, same)
    expect(api.stripProps).toMatchObject({
      'data-scope': 'history',
      'data-part': 'strip',
      role: 'img',
      'data-size': 'md',
    })
    expect(api.stripProps['aria-label']).toBe('The last 8 attempts: 6 succeeded, 1 failed, 1 with a remark')
    expect(api.label).toBe(api.stripProps['aria-label'])
  })

  it('the label stands before the reading', () => {
    const api = connect({ ticks: [ok, ok], label: 'Nightly build' }, same)
    expect(api.label).toBe('Nightly build: The last 2 attempts: 2 succeeded')
  })

  it('tells "we have no result" from "nobody looked"', () => {
    const api = connect({ ticks: [ok, {}, { empty: true }, { tone: 'neutral' }] }, same)
    expect(api.counts).toEqual({ ok: 1, warn: 0, error: 0, running: 0, unknown: 2, empty: 1 })
    // The attempt that was never made is not counted among the attempts.
    expect(api.attempts).toBe(3)
    expect(api.label).toBe('The last 3 attempts: 1 succeeded, 2 with no result, 1 never attempted')
    const marks = api.groups[0].ticks.map((tick) => tick.tickProps)
    expect(marks[1]['data-tone']).toBeUndefined()
    expect(marks[2]).toMatchObject({ 'data-empty': '', 'aria-hidden': 'true' })
    expect(marks[2]['data-tone']).toBeUndefined()
    expect(marks[3]['data-tone']).toBe('neutral')
  })

  it('a strip with nothing in it keeps its name', () => {
    expect(connect({ ticks: [] }, same).label).toBe('Nothing has run yet')
    expect(connect({ ticks: [{ empty: true }, { empty: true }] }, same).label).toBe('Nothing has run yet')
    expect(connect({ ticks: [] }, same, { words: { empty: 'No builds yet' } }).label).toBe('No builds yet')
  })

  it('one attempt is one attempt, and the figures are the locale’s', () => {
    expect(connect({ ticks: [ok] }, same).label).toBe('The last attempt: 1 succeeded')
    const many = Array.from({ length: 1200 }, () => ok)
    expect(connect({ ticks: many, locale: 'de-DE' }, same).label).toBe('The last 1.200 attempts: 1.200 succeeded')
  })

  it('ungrouped: one batch of everything, and no ruler', () => {
    const api = connect({ ticks: night }, same)
    expect(api.grouped).toBe(false)
    expect(api.axis).toBe(false)
    expect(api.groups).toHaveLength(1)
    expect(api.groups[0].ticks).toHaveLength(8)
  })

  it('a batch takes the share of the strip its attempts are worth', () => {
    const api = connect({ groups: [{ ticks: [ok] }, { ticks: [ok, ok, ok, ok, ok, ok, ok] }] }, same)
    expect(api.grouped).toBe(true)
    expect(api.groups.map((group) => group.count)).toEqual([1, 7])
    expect(api.groups[0].groupProps.style).toEqual({ '--gg-history-n': 1 })
    expect(api.groups[1].groupProps.style).toEqual({ '--gg-history-n': 7 })
  })

  it('the aggregate form: one mark for a busy hour, and the hour keeps its weight', () => {
    const api = connect({ groups: [{ ticks: [{ tone: 'error' }], count: 12 }] }, same)
    expect(api.groups[0].ticks).toHaveLength(1)
    expect(api.groups[0].groupProps.style).toEqual({ '--gg-history-n': 12 })
    // The reading counts the marks it was given: what it did not draw it cannot count.
    expect(api.attempts).toBe(1)
  })

  it('the ruler repeats the batches’ shares, and only exists when they are named', () => {
    const plain = connect({ groups: [{ ticks: [ok] }, { ticks: [ok, ok] }] }, same)
    expect(plain.axis).toBe(false)
    const api = connect(
      { groups: [{ ticks: [ok], label: '00' }, { ticks: [ok, ok], label: '01', minor: true, count: 5 }] },
      same
    )
    expect(api.axis).toBe(true)
    expect(api.axisCells.map((cell) => cell.label)).toEqual(['00', '01'])
    expect(api.axisCells.map((cell) => cell.cellProps.style)).toEqual([{ '--gg-history-n': 1 }, { '--gg-history-n': 5 }])
    expect(api.axisCells[0].cellProps['data-minor']).toBeUndefined()
    expect(api.axisCells[1].cellProps['data-minor']).toBe('')
    expect(api.axisProps).toMatchObject({ 'data-part': 'axis', 'aria-hidden': 'true' })
  })

  it('the marks are for the eye: hidden from a reader, with a title for the pointer', () => {
    const api = connect({ groups: [{ ticks: [{ tone: 'ok', title: '03:00' }], title: '03:00 — 5 checks' }] }, same)
    expect(api.groups[0].groupProps).toMatchObject({ 'aria-hidden': 'true', title: '03:00 — 5 checks' })
    expect(api.groups[0].ticks[0].tickProps).toMatchObject({ 'aria-hidden': 'true', title: '03:00' })
    expect(api.rootProps).toEqual({ 'data-scope': 'history', 'data-part': 'root' })
  })

  it('the three heights are the caller’s, and a grouped strip says so', () => {
    expect(connect({ ticks: [ok], size: 'sm' }, same).stripProps['data-size']).toBe('sm')
    expect(connect({ ticks: [ok], size: 'lg' }, same).stripProps['data-size']).toBe('lg')
    expect(connect({ ticks: [ok] }, same).stripProps['data-grouped']).toBeUndefined()
    expect(connect({ groups: [{ ticks: [ok] }] }, same).stripProps['data-grouped']).toBe('')
  })
})
