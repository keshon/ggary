import { describe, expect, it, vi } from 'vitest'
import { connect as connectField } from '../packages/core/src/components/field/field.connect'
import { initialState, reducer } from '../packages/core/src/components/field/field.machine'
import type { FieldEvent, FieldState } from '../packages/core/src/components/field/field.types'
import { connect as connectInput } from '../packages/core/src/components/input/input.connect'
import { mergeProps } from '../packages/core/src/utils/merge-props'

const identity = <T,>(props: T) => props
const setup = (overrides: Partial<FieldState> = {}): FieldState => ({ ...initialState({ id: 'f' }), ...overrides })
const run = (state: FieldState, ...events: FieldEvent[]) => events.reduce(reducer, state)
const field = (state: FieldState, options = {}) => connectField(state, () => {}, identity, options)

const invalidNative = { valid: false, message: 'Please fill out this field.' }
const validNative = { valid: true, message: '' }

describe('validation timing — the :user-invalid rule', () => {
  it('shows no native error before the user has left the control', () => {
    const state = run(setup(), { type: 'INPUT', ...invalidNative })
    expect(field(state).invalid).toBe(false)
  })

  it('does not even change state while untouched, so typing does not re-render', () => {
    const state = setup()
    expect(reducer(state, { type: 'INPUT', ...invalidNative })).toBe(state)
  })

  it('shows the native error once the user leaves the control', () => {
    const api = field(run(setup(), { type: 'BLUR', ...invalidNative }))
    expect(api.invalid).toBe(true)
    expect(api.errorText).toBe('Please fill out this field.')
  })

  it('clears live as the value is fixed, once touched', () => {
    const state = run(setup(), { type: 'BLUR', ...invalidNative }, { type: 'INPUT', ...validNative })
    expect(field(state).invalid).toBe(false)
  })

  it('shows on a submit attempt even if the control was never focused', () => {
    const api = field(run(setup(), { type: 'INVALID', message: 'Required' }))
    expect(api.invalid).toBe(true)
    expect(api.errorText).toBe('Required')
  })

  it('an owner-declared invalid shows at once, untouched', () => {
    expect(field(run(setup(), { type: 'SYNC', invalid: true }), { error: 'Taken' }).errorText).toBe('Taken')
  })

  it('reset returns to untouched', () => {
    const state = run(setup(), { type: 'BLUR', ...invalidNative }, { type: 'RESET' })
    expect(field(state).invalid).toBe(false)
  })

  it('SYNC reads an absent flag as false, and returns the same object when nothing changed', () => {
    const synced = run(setup(), { type: 'SYNC', required: true, disabled: true })
    expect(run(synced, { type: 'SYNC' })).toMatchObject({ required: false, disabled: false })
    expect(reducer(synced, { type: 'SYNC', required: true, disabled: true })).toBe(synced)
  })
})

describe('the hint/error slot', () => {
  it('describes the control by the hint while valid', () => {
    const api = field(setup(), { hint: true, error: 'Bad' })
    expect(api.control['aria-describedby']).toBe('f-hint')
    expect(api.hintProps.hidden).toBeUndefined()
    expect(api.errorProps.hidden).toBe(true)
  })

  it('an error REPLACES the hint in the same slot, and in the description', () => {
    const api = field(run(setup(), { type: 'SYNC', invalid: true }), { hint: true, error: 'Bad' })
    expect(api.control['aria-describedby']).toBe('f-error')
    expect(api.hintProps.hidden).toBe(true)
    expect(api.errorProps.hidden).toBeUndefined()
  })

  it('invalid with no message to show keeps the hint, and still marks the control invalid', () => {
    const api = field(run(setup(), { type: 'SYNC', invalid: true }), { hint: true })
    expect(api.showError).toBe(false)
    expect(api.control['aria-describedby']).toBe('f-hint')
    expect(api.control['aria-invalid']).toBe('true')
  })

  it('an error message is not shown while the field is valid', () => {
    expect(field(setup(), { error: 'Bad' }).showError).toBe(false)
  })

  it('wires the label to the control and marks required for the theme, not in markup', () => {
    const api = field(run(setup(), { type: 'SYNC', required: true }))
    expect(api.labelProps.for).toBe(api.control.id)
    expect(api.labelProps['data-required']).toBe('')
    expect(api.control.required).toBe(true)
  })
})

describe('mergeProps', () => {
  it('runs both handlers, in order', () => {
    const calls: string[] = []
    const merged = mergeProps({ onInput: () => calls.push('input') }, { onInput: () => calls.push('field') })
    merged.onInput()
    expect(calls).toEqual(['input', 'field'])
  })

  it('joins id lists without duplicates, lets absent values yield, and lets the later bag win otherwise', () => {
    const merged = mergeProps(
      { id: 'own', 'aria-describedby': 'a b', required: true, placeholder: 'x' },
      { id: 'field', 'aria-describedby': 'b c', required: undefined }
    )
    expect(merged).toEqual({ id: 'field', 'aria-describedby': 'a b c', required: true, placeholder: 'x' })
  })
})

describe('input inside a field', () => {
  it('keeps both value handling and field validation on the one element', () => {
    const onValueChange = vi.fn()
    const send = vi.fn()
    const fieldApi = connectField(setup(), send, identity, {})
    const { rootProps } = connectInput({ type: 'email' }, identity, { onValueChange, field: fieldApi.control })

    const target = { value: 'a@b', validity: { valid: true }, validationMessage: '' }
    rootProps.onInput({ currentTarget: target } as unknown as Event)

    expect(onValueChange).toHaveBeenCalledWith('a@b')
    expect(send).toHaveBeenCalledWith({ type: 'INPUT', valid: true, message: '' })
    expect(rootProps.id).toBe('f-control')
    expect(rootProps['data-scope']).toBe('input')
  })
})
