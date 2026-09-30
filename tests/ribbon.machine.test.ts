import { describe, expect, it, vi } from 'vitest'
import { createRibbonMachine } from '../packages/core/src/components/ribbon'

const items = [
  { value: 'model', label: 'Model' },
  { value: 'modify', label: 'Modify' },
  { value: 'locked', label: 'Locked', disabled: true },
  { value: 'animate', label: 'Animate' },
]

describe('ribbon machine', () => {
  it('starts on the first enabled tab', () => {
    expect(createRibbonMachine({ id: 'r', items }).getState().value).toBe('model')
  })

  it('moves and chooses with the arrows, wrapping and skipping disabled tabs', () => {
    const onValueChange = vi.fn()
    const machine = createRibbonMachine({ id: 'r', items, onValueChange })
    machine.send({ type: 'MOVE', step: 1 })
    expect(machine.getState().value).toBe('modify')
    machine.send({ type: 'MOVE', step: 1 })
    // locked is skipped, landing on animate
    expect(machine.getState().value).toBe('animate')
    machine.send({ type: 'MOVE', step: 1 })
    // wraps to the start
    expect(machine.getState().value).toBe('model')
    expect(onValueChange).toHaveBeenCalledTimes(3)
  })

  it('never selects a disabled tab', () => {
    const machine = createRibbonMachine({ id: 'r', items })
    machine.send({ type: 'SELECT', value: 'locked' })
    expect(machine.getState().value).toBe('model')
  })

  it('a tab that goes away hands over to its neighbour', () => {
    const onValueChange = vi.fn()
    const machine = createRibbonMachine({ id: 'r', items, defaultValue: 'modify', onValueChange })
    machine.send({ type: 'SYNC_ITEMS', items: items.filter((item) => item.value !== 'modify') })
    // nearest, forward first: animate stands where modify was
    expect(machine.getState().value).toBe('animate')
    expect(onValueChange).toHaveBeenCalledWith('animate')
  })
})
