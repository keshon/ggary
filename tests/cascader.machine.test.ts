import { describe, expect, it } from 'vitest'
import { columnsOf, connect, createCascaderMachine, nodesOf } from '../packages/core/src/components/cascader'
import { places } from './conformance/places'

/**
 * The cascader with no DOM: the columns a highlight opens, the keyboard
 * walking down and across them, choosing a leaf and, when allowed, a branch.
 */

const same = (props: Record<string, unknown>) => props

const cascader = (config: Partial<Parameters<typeof createCascaderMachine>[0]> = {}) => {
  const changes: string[][] = []
  const machine = createCascaderMachine({ id: 'c', items: places, onValueChange: (value) => changes.push(value), ...config })
  const api = () => connect(machine.getState(), machine.send, same, { label: 'Place' })
  return { machine, api, changes }
}

describe('the cascader', () => {
  it('a highlighted branch opens its children as the next column', () => {
    expect(columnsOf(places, []).map((column) => column.length)).toEqual([3])
    expect(columnsOf(places, ['ru', 'tat']).map((column) => column[0].value)).toEqual(['ru', 'msk', 'kzn'])
    expect(nodesOf(places, ['ru', 'tat', 'kzn']).map((node) => node.label)).toEqual(['Russia', 'Tatarstan', 'Kazan'])
  })

  it('opens on the first item, walks down a column and across into the children, and back', () => {
    const { machine, api } = cascader()
    machine.send({ type: 'OPEN' })
    expect(machine.getState()).toMatchObject({ active: ['ru'], focusLevel: 0 })
    expect(api().columns).toHaveLength(2)
    machine.send({ type: 'INTO' })
    expect(machine.getState()).toMatchObject({ active: ['ru', 'msk'], focusLevel: 1 })
    machine.send({ type: 'MOVE', step: 1 })
    machine.send({ type: 'MOVE', step: 1 })
    // Saint Petersburg is disabled: the highlight goes past it.
    expect(machine.getState().active).toEqual(['ru', 'sam'])
    machine.send({ type: 'MOVE', step: -1 })
    expect(machine.getState().active).toEqual(['ru', 'tat'])
    expect(api().columns.map((column) => column[0].label)).toEqual(['Russia', 'Moscow', 'Kazan'])
    machine.send({ type: 'OUT' })
    expect(machine.getState()).toMatchObject({ active: ['ru'], focusLevel: 0 })
  })

  it('Enter on a leaf chooses the whole path and closes; on a branch it opens the branch', () => {
    const { machine, api, changes } = cascader()
    machine.send({ type: 'OPEN' })
    machine.send({ type: 'SELECT' })
    expect(machine.getState()).toMatchObject({ focusLevel: 1, active: ['ru', 'msk'], open: true })
    machine.send({ type: 'SELECT', level: 1, value: 'tat' })
    machine.send({ type: 'SELECT', level: 2, value: 'kzn' })
    expect(changes).toEqual([['ru', 'tat', 'kzn']])
    expect(api().open).toBe(false)
    expect(api().chosen.map((node) => node.label)).toEqual(['Russia', 'Tatarstan', 'Kazan'])
    expect(api().hiddenInputProps.value).toBe('kzn')
  })

  it('reopens on the chosen path, its last column focused, and Right goes back along the choice', () => {
    const { machine, api } = cascader({ defaultValue: ['ru', 'tat', 'chelny'] })
    machine.send({ type: 'OPEN' })
    expect(machine.getState()).toMatchObject({ active: ['ru', 'tat', 'chelny'], focusLevel: 2 })
    expect(api().focusedId).toBe('c-item-2-chelny')
    machine.send({ type: 'OUT' })
    machine.send({ type: 'OUT' })
    machine.send({ type: 'INTO' })
    expect(machine.getState().active).toEqual(['ru', 'tat'])
    machine.send({ type: 'INTO' })
    expect(machine.getState().active).toEqual(['ru', 'tat', 'chelny'])
  })

  it('with selectParents, a branch is a choice of its own', () => {
    const { machine, changes } = cascader({ selectParents: true })
    machine.send({ type: 'OPEN' })
    machine.send({ type: 'SELECT', level: 0, value: 'kz' })
    expect(changes).toEqual([['kz']])
  })

  it('typing a letter goes to the item in the focused column that starts with it', () => {
    const { machine } = cascader()
    machine.send({ type: 'OPEN' })
    machine.send({ type: 'TYPE', char: 'b', now: 1000 })
    expect(machine.getState().active).toEqual(['by'])
  })

  it('each column is a listbox named by its parent, one tab stop on its highlighted item', () => {
    const { machine, api } = cascader()
    machine.send({ type: 'OPEN' })
    machine.send({ type: 'INTO' })
    expect(api().getColumnProps(0)).toMatchObject({ role: 'listbox', 'aria-label': 'Place' })
    expect(api().getColumnProps(1)['aria-label']).toBe('Russia')
    const russia = api().getItemProps(places[0], 0)
    expect(russia).toMatchObject({ role: 'option', tabIndex: 0, 'data-branch': '' })
    expect(api().getItemProps(places[1], 0).tabIndex).toBe(-1)
    expect(api().triggerProps).toMatchObject({ 'aria-haspopup': 'dialog', 'aria-expanded': 'true' })
  })
})
