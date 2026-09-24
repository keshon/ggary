import { describe, expect, it, vi } from 'vitest'
import { connect, createPopconfirmMachine, initialState, reducer } from '../packages/core/src/components/popconfirm'
import type { Dict } from '../packages/core/src/types'

const same = (props: Dict) => props
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('popconfirm', () => {
  const open = () => reducer(initialState({ id: 'p' }), { type: 'OPEN' })

  it('confirms once while an attempt is under way, and closes when it succeeds', async () => {
    let finish!: () => void
    const onConfirm = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)))
    const onOpenChange = vi.fn()
    const machine = createPopconfirmMachine({ id: 'p', onConfirm, onOpenChange })
    machine.send({ type: 'OPEN' })
    machine.send({ type: 'CONFIRM' })
    machine.send({ type: 'CONFIRM' })
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(machine.getState()).toMatchObject({ open: true, pending: true })
    finish()
    await settle()
    expect(machine.getState()).toMatchObject({ open: false, pending: false })
    expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: 'confirm' })
  })

  it('stays open on a failure and says why — the rejection’s message, or the words for it', async () => {
    const machine = createPopconfirmMachine({ id: 'p', onConfirm: () => Promise.reject(new Error('The lead is locked')) })
    machine.send({ type: 'OPEN' })
    machine.send({ type: 'CONFIRM' })
    await settle()
    expect(machine.getState()).toMatchObject({ open: true, pending: false, error: 'The lead is locked' })
    expect(connect(machine.getState(), machine.send, same).errorText).toBe('The lead is locked')

    const silent = createPopconfirmMachine({ id: 'q', onConfirm: () => Promise.reject(undefined) })
    silent.send({ type: 'OPEN' })
    silent.send({ type: 'CONFIRM' })
    await settle()
    expect(connect(silent.getState(), silent.send, same, { words: { failed: 'Не удалось' } }).errorText).toBe('Не удалось')
  })

  it('a thrown error is a failure too, and a plain return closes at once', async () => {
    const thrown = createPopconfirmMachine({ id: 'p', onConfirm: () => { throw new Error('No') } })
    thrown.send({ type: 'OPEN' })
    thrown.send({ type: 'CONFIRM' })
    expect(thrown.getState()).toMatchObject({ open: true, error: 'No' })
    const plain = createPopconfirmMachine({ id: 'q', onConfirm: () => undefined })
    plain.send({ type: 'OPEN' })
    plain.send({ type: 'CONFIRM' })
    await settle()
    expect(plain.getState().open).toBe(false)
  })

  it('closing abandons the attempt: its late answer is not taken for the next', () => {
    let state = reducer(open(), { type: 'CONFIRM' })
    state = reducer(state, { type: 'CLOSE', reason: 'escape' })
    expect(state.pending).toBe(false)
    state = reducer(state, { type: 'OPEN' })
    const late = reducer(state, { type: 'SETTLED', attempt: 1, ok: true })
    expect(late).toBe(state)
    expect(late.open).toBe(true)
  })

  it('a new opening forgets the last failure', () => {
    let state = reducer(open(), { type: 'CONFIRM' })
    state = reducer(state, { type: 'SETTLED', attempt: 1, ok: false, message: 'No' })
    expect(state.error).toBe('No')
    state = reducer(reducer(state, { type: 'CLOSE', reason: 'cancel' }), { type: 'OPEN' })
    expect(state.error).toBeNull()
  })

  it('hears a cancel for every close but the action’s own', async () => {
    const onCancel = vi.fn()
    const machine = createPopconfirmMachine({ id: 'p', onCancel, onConfirm: () => undefined })
    for (const reason of ['cancel', 'escape', 'outside'] as const) {
      machine.send({ type: 'OPEN' })
      machine.send({ type: 'CLOSE', reason })
    }
    machine.send({ type: 'OPEN' })
    machine.send({ type: 'CONFIRM' })
    await settle()
    expect(onCancel).toHaveBeenCalledTimes(3)
  })

  it('puts the focus on the safe answer when the action destroys, and on the action otherwise', () => {
    const state = open()
    const destroys = connect(state, () => {}, same, { destructive: true })
    expect(destroys.cancelProps).toMatchObject({ 'data-answer': 'cancel', 'data-autofocus': '' })
    expect(destroys.confirmProps['data-autofocus']).toBeUndefined()
    const plain = connect(state, () => {}, same)
    expect(plain.confirmProps).toMatchObject({ 'data-answer': 'confirm', 'data-autofocus': '' })
    expect(plain.cancelProps['data-autofocus']).toBeUndefined()
  })

  it('is an alert dialog named by its question and described by what follows and by a failure', () => {
    let state = reducer(open(), { type: 'CONFIRM' })
    state = reducer(state, { type: 'SETTLED', attempt: 1, ok: false, message: 'No' })
    const api = connect(state, () => {}, same, { description: true })
    expect(api.contentProps).toMatchObject({ role: 'alertdialog', 'aria-labelledby': 'p-title', 'aria-describedby': 'p-description p-error' })
    expect(api.errorProps).toMatchObject({ role: 'alert', id: 'p-error' })
  })
})
