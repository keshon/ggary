import { describe, expect, it, vi } from 'vitest'
import { connect, createTimePickerMachine, initialState, reducer } from '../packages/core/src/components/time-picker'
import { formatTime, hourCycle, joinDateTime, nearestTime, parseTypedTime, splitDateTime, timeSteps } from '../packages/core/src/utils/time'
import type { Dict } from '../packages/core/src/types'

const same = (props: Dict) => props

describe('times', () => {
  it('reads a time the ways people type one, in either clock', () => {
    const cases: [string, string | null][] = [
      ['9', '09:00'],
      ['930', '09:30'],
      ['0930', '09:30'],
      ['9:30', '09:30'],
      ['9.30', '09:30'],
      ['9h30', '09:30'],
      ['21:30', '21:30'],
      ['9:30pm', '21:30'],
      ['9:30 PM', '21:30'],
      ['9 pm', '21:00'],
      ['9p', '21:00'],
      ['9 p.m.', '21:00'],
      ['12am', '00:00'],
      ['12 pm', '12:00'],
      ['0:05', '00:05'],
      ['24:00', null],
      ['9:75', null],
      ['13pm', null],
      ['noon', null],
      ['', null],
    ]
    for (const [text, time] of cases) expect(parseTypedTime(text, 'en-US'), text).toBe(time)
  })

  it('reads the locale’s own words for the halves of the day', () => {
    const [am, pm] = [formatTime('09:00', 'ko-KR'), formatTime('21:00', 'ko-KR')]
    expect(am).not.toBe(pm)
    expect(parseTypedTime(pm, 'ko-KR')).toBe('21:00')
  })

  it('writes a time in the locale’s clock', () => {
    expect(hourCycle('en-US')).toBe(12)
    expect(hourCycle('de-DE')).toBe(24)
    expect(formatTime('14:30', 'de-DE')).toBe('14:30')
    expect(formatTime('14:30', 'en-US')).toMatch(/^2:30\sPM$/)
  })

  it('lists the times at a step between min and max, and finds the nearest', () => {
    expect(timeSteps(30, '08:00', '10:00')).toEqual(['08:00', '08:30', '09:00', '09:30', '10:00'])
    expect(timeSteps(15)).toHaveLength(96)
    expect(nearestTime(['09:00', '09:30', '10:00'], '09:44')).toBe('09:30')
    expect(nearestTime(['09:00', '09:30', '10:00'], '09:46')).toBe('10:00')
  })
})

describe('a day and a time', () => {
  it('join only when both are there', () => {
    expect(joinDateTime('2026-09-18', '14:30')).toBe('2026-09-18T14:30')
    expect(joinDateTime('2026-09-18', null)).toBeNull()
    expect(joinDateTime(null, '14:30')).toBeNull()
  })

  it('split back into their halves; a bare day keeps its day, and anything else is neither', () => {
    expect(splitDateTime('2026-09-18T14:30')).toEqual({ date: '2026-09-18', time: '14:30' })
    expect(splitDateTime('2026-09-18')).toEqual({ date: '2026-09-18', time: null })
    expect(splitDateTime('2026-09-18T25:00')).toEqual({ date: '2026-09-18', time: null })
    expect(splitDateTime('18.09.2026 14:30')).toEqual({ date: null, time: null })
    expect(splitDateTime(null)).toEqual({ date: null, time: null })
  })
})

describe('time picker', () => {
  const start = (config: Partial<Parameters<typeof initialState>[0]> = {}) => initialState({ id: 't', locale: 'en-US', step: 30, ...config })

  it('opens on the value, or on the time nearest to now', () => {
    expect(reducer(start({ defaultValue: '14:00' }), { type: 'OPEN', now: '09:12' }).highlighted).toBe('14:00')
    expect(reducer(start(), { type: 'OPEN', now: '09:12' }).highlighted).toBe('09:00')
  })

  it('typing opens the list on the nearest time, and Enter commits what was typed, off the step too', () => {
    let state = reducer(start(), { type: 'INPUT', text: '9:37' })
    expect(state).toMatchObject({ open: true, highlighted: '09:30', editing: true })
    state = reducer(state, { type: 'COMMIT_TEXT' })
    expect(state).toMatchObject({ value: '09:37', open: false, editing: false, invalid: false })
    expect(state.intent).toEqual({ value: '09:37', nonce: 1 })
  })

  it('walking the list leaves what was typed, and choosing takes the time walked to', () => {
    let state = reducer(start(), { type: 'INPUT', text: '9' })
    state = reducer(state, { type: 'MOVE', by: 'next' })
    expect(state).toMatchObject({ highlighted: '09:30', editing: false, text: '' })
    state = reducer(state, { type: 'MOVE', by: 'page-down' })
    expect(state.highlighted).toBe('11:30')
    state = reducer(state, { type: 'MOVE', by: 'last' })
    expect(state.highlighted).toBe('23:30')
    state = reducer(state, { type: 'CHOOSE', time: state.highlighted! })
    expect(state).toMatchObject({ value: '23:30', open: false })
  })

  it('refuses a typed time that is not one, or is outside min and max, or disabled', () => {
    const bounded = start({ min: '08:00', max: '18:00', isTimeDisabled: (time) => time === '12:00' })
    for (const text of ['noon', '7:00', '19:00', '12:00']) {
      const state = reducer(reducer(bounded, { type: 'INPUT', text }), { type: 'COMMIT_TEXT' })
      expect(state.invalid, text).toBe(true)
      expect(state.value).toBeNull()
    }
    expect(reducer(bounded, { type: 'CHOOSE', time: '12:00' })).toBe(bounded)
  })

  it('an emptied field clears the value', () => {
    const state = reducer(reducer(start({ defaultValue: '10:00' }), { type: 'INPUT', text: '' }), { type: 'COMMIT_TEXT' })
    expect(state.value).toBeNull()
    expect(state.intent.value).toBeNull()
  })

  it('tells the owner of a new value, and of the list opening and closing', () => {
    const onValueChange = vi.fn()
    const onOpenChange = vi.fn()
    const machine = createTimePickerMachine({ id: 't', onValueChange, onOpenChange })
    machine.send({ type: 'OPEN', now: '10:00' })
    machine.send({ type: 'CHOOSE', time: '10:15' })
    expect(onValueChange).toHaveBeenCalledWith('10:15')
    expect(onOpenChange.mock.calls).toEqual([[true], [false]])
  })

  it('is a combobox over a listbox, whose active option is the highlighted time', () => {
    const state = reducer(start({ defaultValue: '14:00' }), { type: 'OPEN' })
    const api = connect(state, () => {}, same, { name: 'at' })
    expect(api.inputProps).toMatchObject({ role: 'combobox', 'aria-expanded': 'true', 'aria-controls': 't-content', 'aria-activedescendant': 't-time-1400' })
    expect(api.contentProps).toMatchObject({ role: 'listbox' })
    expect(api.getItemProps('14:00')).toMatchObject({ role: 'option', 'aria-selected': 'true', 'data-highlighted': '' })
    expect(api.inputProps.value).toMatch(/^2:00\sPM$/)
    expect(api.hiddenInputProps).toMatchObject({ name: 'at', value: '14:00' })
    expect(api.times).toHaveLength(48)
  })
})
