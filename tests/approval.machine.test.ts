import { describe, expect, it, vi } from 'vitest'
import { approvalIds, connect } from '../packages/core/src/components/approval'

const same = (p: Record<string, unknown>) => p
const base = { id: 'a1', what: 'rm -rf build/' }

describe('approval', () => {
  it('is a group named by its heading, or it falls apart into unrelated paragraphs', () => {
    const api = connect(base, same)
    expect(api.rootProps.role).toBe('group')
    expect(api.rootProps['aria-labelledby']).toBe(approvalIds('a1').title)
    expect(api.titleProps.id).toBe(approvalIds('a1').title)
    expect(api.title).toBe('Confirmation is required')
  })

  it('reaches a live region while it waits, and stops shouting once answered', () => {
    expect(connect(base, same).rootProps['aria-live']).toBe('polite')
    expect(connect({ ...base, live: 'assertive' }, same).rootProps['aria-live']).toBe('assertive')
    expect(connect({ ...base, live: 'off' }, same).rootProps['aria-live']).toBeUndefined()
    expect(connect({ ...base, state: 'approved' }, same).rootProps['aria-live']).toBeUndefined()
  })

  it('shows the two answers only while pending, and keeps the record after', () => {
    const pending = connect(base, same)
    expect(pending.showActions).toBe(true)
    expect(pending.verdict).toBeUndefined()

    const approved = connect({ ...base, state: 'approved', decidedBy: 'Anna', decidedAt: '14:32' }, same)
    expect(approved.showActions).toBe(false)
    expect(approved.verdict).toBe('Allowed by Anna at 14:32')
    expect(connect({ ...base, state: 'denied', decidedAt: '14:32' }, same).verdict).toBe('Denied at 14:32')
    expect(connect({ ...base, state: 'denied' }, same).verdict).toBe('Denied')
  })

  it('answers in one press, and denial costs no more presses than consent', () => {
    const onDecide = vi.fn()
    const api = connect(base, same, { onDecide })
    expect([api.allow.label, api.deny.label]).toEqual(['Allow', 'Deny'])
    api.allow.onClick()
    api.deny.onClick()
    expect(onDecide.mock.calls).toEqual([['approved'], ['denied']])
  })

  it('announces how many consequences there are before they are read', () => {
    const effects = [{ text: 'heightmap.ts — overwrite' }, { text: 'chunks.bin — deletion', tone: 'error' as const }]
    const api = connect({ ...base, effects }, same)
    expect(api.effectsProps['aria-label']).toBe('It will touch 2')
    expect(api.getEffectProps(effects[0])['data-tone']).toBeUndefined()
    expect(api.getEffectProps(effects[1])['data-tone']).toBe('error')
    // A list with nothing in it is not named: the adapter draws no list at all.
    expect(connect(base, same).effectsProps['aria-label']).toBeUndefined()
  })

  it('carries the state as data, for the step back', () => {
    expect(connect(base, same).rootProps['data-state']).toBe('pending')
    expect(connect({ ...base, state: 'denied' }, same).rootProps['data-state']).toBe('denied')
  })

  it('takes the words of another language', () => {
    const words = {
      title: 'Нужно подтверждение',
      allow: 'Разрешить',
      deny: 'Запретить',
      effects: (n: number) => `Затронет: ${n}`,
    }
    const api = connect({ ...base, effects: [{ text: 'build/' }] }, same, {}, words)
    expect(api.title).toBe('Нужно подтверждение')
    expect([api.allow.label, api.deny.label]).toEqual(['Разрешить', 'Запретить'])
    expect(api.effectsProps['aria-label']).toBe('Затронет: 1')
  })
})
