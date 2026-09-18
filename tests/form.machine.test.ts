import { describe, expect, it } from 'vitest'
import { connectSummary, createFormMachine, formErrorOf } from '../packages/core/src/components/form'

/** A form's state with no DOM: errors by name, where the focus goes, and what stays after an edit. */

const same = (props: Record<string, unknown>) => props

describe('form', () => {
  it('a submit with errors keeps the rules’, counts the try, and aims the focus at the summary when there is one', () => {
    const machine = createFormMachine({ id: 'f' })
    machine.send({ type: 'INVALID', errors: { role: 'Choose a role' } })
    expect(machine.getState()).toMatchObject({ status: 'invalid', submitCount: 1, errors: { role: 'Choose a role' }, focus: { target: 'first', nonce: 1 } })
    machine.send({ type: 'SUMMARY_MOUNT' })
    machine.send({ type: 'INVALID', errors: { role: 'Choose a role', confirm: null as unknown as string } })
    expect(machine.getState().focus).toEqual({ target: 'summary', nonce: 2 })
    expect(machine.getState().errors).toEqual({ role: 'Choose a role' })
  })

  it('an edit takes that field’s error away; the rules again replace theirs and leave the server’s', () => {
    const machine = createFormMachine({ id: 'f' })
    machine.send({ type: 'SUBMITTED', errors: { email: 'Taken', confirm: 'Differ' }, message: 'Not saved' })
    expect(machine.getState().status).toBe('failed')
    machine.send({ type: 'EDITED', name: 'confirm' })
    expect(machine.getState().errors).toEqual({ email: 'Taken' })
    machine.send({ type: 'RULES', errors: { confirm: 'Differ' }, names: ['confirm', 'role'] })
    expect(machine.getState().errors).toEqual({ email: 'Taken', confirm: 'Differ' })
    machine.send({ type: 'RULES', errors: {}, names: ['confirm', 'role'] })
    expect(machine.getState().errors).toEqual({ email: 'Taken' })
  })

  it('a submission that comes back with nothing is done; a reset starts over', () => {
    const statuses: string[] = []
    const machine = createFormMachine({ id: 'f', onStatusChange: (status) => statuses.push(status) })
    machine.send({ type: 'SUBMITTING' })
    machine.send({ type: 'SUBMITTED' })
    machine.send({ type: 'INVALID', errors: {} })
    machine.send({ type: 'RESET' })
    expect(statuses).toEqual(['submitting', 'submitted', 'invalid', 'idle'])
    expect(machine.getState().submitCount).toBe(0)
  })

  it('fields register by name, and a field reads its error', () => {
    const machine = createFormMachine({ id: 'f' })
    machine.send({ type: 'REGISTER', name: 'role', id: 'role-trigger', label: 'Role' })
    machine.send({ type: 'INVALID', errors: { role: 'Choose a role' } })
    expect(machine.getState().fields).toEqual({ role: { id: 'role-trigger', label: 'Role' } })
    expect(formErrorOf(machine.getState(), 'role')).toBe('Choose a role')
    expect(formErrorOf(machine.getState(), undefined)).toBeUndefined()
    machine.send({ type: 'UNREGISTER', name: 'role', id: 'other' })
    expect(machine.getState().fields.role).toBeDefined()
    machine.send({ type: 'UNREGISTER', name: 'role', id: 'role-trigger' })
    expect(machine.getState().fields).toEqual({})
  })

  it('the summary shows after a failed submit, as a named region its heading labels, each error a link', () => {
    const machine = createFormMachine({ id: 'f' })
    expect(connectSummary(machine.getState(), same).shown).toBe(false)
    machine.send({ type: 'INVALID', errors: {} })
    machine.send({ type: 'SUMMARY', items: [{ id: 'email', name: 'email', label: 'Email', message: 'Enter an email address' }] })
    const api = connectSummary(machine.getState(), same, {}, { headingLevel: 3 })
    expect(api.shown).toBe(true)
    expect(api.rootProps).toMatchObject({ role: 'region', tabIndex: -1, 'aria-labelledby': 'f-summary-title', hidden: undefined })
    expect(api.titleProps).toMatchObject({ role: 'heading', 'aria-level': 3 })
    expect(api.getLinkProps(api.items[0])).toMatchObject({ href: '#email' })
    expect(api.itemText(api.items[0])).toBe('Email: Enter an email address')
  })
})
