import { describe, expect, it, vi } from 'vitest'
import { createTimePickerMachine } from '../packages/core/src/components/time-picker'
import { createDatePickerMachine } from '../packages/core/src/components/date-picker'

describe('picker RESET domain event', () => {
  it('clears time error/draft/open state even when the accepted value is unchanged', () => {
    const changed = vi.fn()
    const machine = createTimePickerMachine({ id: 'time', value: '14:30', onValueChange: changed })
    machine.send({ type: 'INPUT', text: 'invalid' })
    machine.send({ type: 'COMMIT_TEXT' })
    expect(machine.getState().invalid).toBe(true)
    machine.send({ type: 'OPEN' })
    machine.send({ type: 'RESET', value: '14:30' })
    expect(machine.getState()).toMatchObject({ value: '14:30', text: '', editing: false, invalid: false, open: false, highlighted: null })
    expect(changed).not.toHaveBeenCalled()
  })
  it('clears date errors and unfinished range navigation without emitting a selection', () => {
    const changed = vi.fn()
    const value = { start: '2026-09-18', end: '2026-09-20' }
    const machine = createDatePickerMachine({ id: 'date', mode: 'range', value, onValueChange: changed })
    machine.send({ type: 'INPUT', text: 'invalid' })
    machine.send({ type: 'COMMIT_TEXT' })
    expect(machine.getState().invalid).toBe(true)
    machine.send({ type: 'OPEN' })
    machine.send({ type: 'RESET', value })
    expect(machine.getState()).toMatchObject({ text: '', editing: false, invalid: false, open: false, calendar: { value, anchor: null, hovered: null } })
    expect(changed).not.toHaveBeenCalled()
  })
})
