import { describe, expect, it, vi } from 'vitest'
import { connect } from '../packages/core/src/components/dialog/dialog.connect'
import { createDialogMachine, initialState, reducer } from '../packages/core/src/components/dialog/dialog.machine'
import type { DialogEvent, DialogState } from '../packages/core/src/components/dialog/dialog.types'

const run = (state: DialogState, ...events: DialogEvent[]) => events.reduce(reducer, state)
const identity = <T,>(props: T) => props

describe('dialog machine — uncontrolled', () => {
  it('opens and closes, recording why', () => {
    const opened = run(initialState({ id: 'd' }), { type: 'OPEN' })
    expect(opened.open).toBe(true)
    expect(opened.intent).toMatchObject({ open: true, reason: 'trigger', nonce: 1 })
    const closed = run(opened, { type: 'CLOSE', reason: 'escape' })
    expect(closed.open).toBe(false)
    expect(closed.intent).toMatchObject({ open: false, reason: 'escape', nonce: 2 })
  })

  it('a request for the state it is in is no request', () => {
    const state = initialState({ id: 'd' })
    expect(run(state, { type: 'CLOSE', reason: 'escape' })).toBe(state)
    const open = run(state, { type: 'OPEN' })
    expect(run(open, { type: 'OPEN' })).toBe(open)
  })

  it('starts from defaultOpen', () => {
    expect(initialState({ id: 'd', defaultOpen: true }).open).toBe(true)
  })
})

describe('dialog machine — controlled', () => {
  it('reports a request without moving', () => {
    const state = initialState({ id: 'd', open: true })
    const asked = run(state, { type: 'CLOSE', reason: 'outside' })
    expect(asked.open).toBe(true)
    expect(asked.intent).toMatchObject({ open: false, reason: 'outside', nonce: 1 })
  })

  it('an owner that refuses by doing nothing still hears the next request', () => {
    const state = initialState({ id: 'd', open: true })
    const twice = run(state, { type: 'CLOSE', reason: 'escape' }, { type: 'CLOSE', reason: 'escape' })
    expect(twice.intent.nonce).toBe(2)
    expect(twice.open).toBe(true)
  })

  it('moves only on the owner’s answer, which tells nobody', () => {
    const state = initialState({ id: 'd', open: false })
    const answered = run(state, { type: 'OPEN' }, { type: 'SYNC_OPEN', open: true })
    expect(answered.open).toBe(true)
    expect(answered.intent.nonce).toBe(1)
  })
})

describe('dialog machine — options and callback', () => {
  it('syncs options, reading an absent one as its default', () => {
    const state = initialState({ id: 'd', modal: false, closeOnEscape: false })
    const synced = run(state, { type: 'SYNC_OPTIONS', closeOnEscape: false })
    expect(synced).toMatchObject({ modal: true, closeOnEscape: false, closeOnOutside: true, role: 'dialog' })
    expect(run(synced, { type: 'SYNC_OPTIONS', closeOnEscape: false })).toBe(synced)
  })

  it('a form close carries the submitter’s value to the owner', () => {
    const onOpenChange = vi.fn()
    const machine = createDialogMachine({ id: 'd', defaultOpen: true, onOpenChange })
    machine.send({ type: 'CLOSE', reason: 'native', returnValue: 'delete' })
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: 'native', returnValue: 'delete' })
  })

  it('onOpenChange fires once per request, with the reason', () => {
    const onOpenChange = vi.fn()
    const machine = createDialogMachine({ id: 'd', onOpenChange })
    machine.send({ type: 'OPEN' })
    machine.send({ type: 'OPEN' })
    machine.send({ type: 'CLOSE', reason: 'close-button' })
    machine.send({ type: 'SYNC_OPEN', open: true })
    expect(onOpenChange.mock.calls).toEqual([
      [true, { reason: 'trigger' }],
      [false, { reason: 'close-button' }],
    ])
  })
})

describe('dialog connect', () => {
  it('names the dialog by its title and description only when they exist', () => {
    const state = initialState({ id: 'd', defaultOpen: true })
    expect(connect(state, () => {}, identity).contentProps['aria-labelledby']).toBeUndefined()
    const api = connect(state, () => {}, identity, { title: true, description: true })
    expect(api.contentProps).toMatchObject({ 'aria-labelledby': 'd-title', 'aria-describedby': 'd-description', 'data-state': 'open' })
    expect(api.titleProps.id).toBe('d-title')
  })

  it('is an alertdialog only when asked, and a modal marks itself for the theme', () => {
    const alert = connect(initialState({ id: 'd', role: 'alertdialog' }), () => {}, identity)
    expect(alert.contentProps).toMatchObject({ role: 'alertdialog', 'data-modal': '' })
    const plain = connect(initialState({ id: 'd', modal: false }), () => {}, identity)
    expect(plain.contentProps.role).toBeUndefined()
    expect(plain.contentProps['data-modal']).toBeUndefined()
  })

  it('the trigger announces a dialog and what it controls', () => {
    const send = vi.fn()
    const api = connect(initialState({ id: 'd' }), send, identity)
    expect(api.triggerProps).toMatchObject({ 'aria-haspopup': 'dialog', 'aria-expanded': 'false', 'aria-controls': 'd-content' })
    api.triggerProps.onClick()
    api.closeProps.onClick()
    api.dismiss('outside')
    api.nativeClose()
    expect(send.mock.calls.map(([event]) => event.reason)).toEqual(['trigger', 'close-button', 'outside', 'native'])
  })
})
