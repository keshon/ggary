import { describe, expect, it, vi } from 'vitest'
import { connect, menuNodes } from '../packages/core/src/components/menu'
import { createMenuMachine, initialState, reducer } from '../packages/core/src/components/menu/menu.machine'
import type { MenuEntry, MenuEvent, MenuState } from '../packages/core/src/components/menu'

const identity = <T,>(props: T) => props

const items: MenuEntry[] = [
  { value: 'edit', label: 'Edit' },
  { value: 'duplicate', label: 'Duplicate', disabled: true },
  { type: 'separator' },
  {
    type: 'group',
    label: 'View',
    items: [
      { type: 'checkbox', value: 'grid', label: 'Show grid', checked: true },
      { type: 'radio', value: 'compact', label: 'Compact', checked: false },
    ],
  },
  { value: 'delete', label: 'Delete', tone: 'danger' },
]

const run = (state: MenuState, ...events: MenuEvent[]) => events.reduce(reducer, state)
const base = initialState({ id: 'm', items })

describe('menu machine — opening and the highlight', () => {
  it('a pointer opens it with nothing highlighted; the keyboard lands on an edge', () => {
    expect(run(base, { type: 'TOGGLE', focus: 'none' })).toMatchObject({ open: true, highlightedIndex: -1 })
    expect(run(base, { type: 'OPEN', focus: 'first' }).highlightedIndex).toBe(0)
    expect(run(base, { type: 'OPEN', focus: 'last' }).highlightedIndex).toBe(4)
  })

  it('arrows wrap, and walk disabled items and groups as one list; separators are not stops', () => {
    const open = run(base, { type: 'OPEN', focus: 'first' })
    const steps = [1, 1, 1, 1, 1].reduce<number[]>((seen, step) => {
      const last = seen.length ? seen[seen.length - 1] : 0
      const state = run({ ...open, highlightedIndex: last }, { type: 'HIGHLIGHT_MOVE', step })
      return [...seen, state.highlightedIndex]
    }, [])
    expect(steps).toEqual([1, 2, 3, 4, 0])
    expect(run(open, { type: 'HIGHLIGHT_MOVE', step: -1 }).highlightedIndex).toBe(4)
  })

  it('closing forgets the highlight, so the next open lands afresh', () => {
    const state = run(base, { type: 'OPEN', focus: 'last' }, { type: 'CLOSE', reason: 'escape' }, { type: 'TOGGLE', focus: 'none' })
    expect(state.highlightedIndex).toBe(-1)
  })

  it('typeahead finds an item by its label, disabled ones included', () => {
    const open = run(base, { type: 'OPEN', focus: 'none' })
    expect(run(open, { type: 'TYPE', char: 'd', now: 1000 }).highlightedIndex).toBe(1)
    expect(run(open, { type: 'TYPE', char: 's', now: 1000 }).highlightedIndex).toBe(2)
  })

  it('does nothing while closed', () => {
    for (const event of [
      { type: 'HIGHLIGHT_MOVE', step: 1 },
      { type: 'HIGHLIGHT', index: 2 },
      { type: 'SELECT', index: 0 },
      { type: 'TYPE', char: 'e', now: 1 },
    ] as MenuEvent[]) {
      expect(reducer(base, event)).toBe(base)
    }
  })
})

describe('menu machine — selecting', () => {
  it('reports the item and closes, choice before close', () => {
    const calls: string[] = []
    const machine = createMenuMachine({
      id: 'm',
      items,
      onSelect: (value) => calls.push(`select ${value}`),
      onOpenChange: (open, details) => calls.push(`${open ? 'open' : 'close'} ${details.reason}`),
    })
    machine.send({ type: 'OPEN', focus: 'first' })
    machine.send({ type: 'SELECT' })
    expect(calls).toEqual(['open trigger', 'select edit', 'close select'])
    expect(machine.getState().open).toBe(false)
  })

  it('a disabled item is reachable but not activated', () => {
    const onSelect = vi.fn()
    const machine = createMenuMachine({ id: 'm', items, onSelect })
    machine.send({ type: 'OPEN', focus: 'first' })
    machine.send({ type: 'HIGHLIGHT_MOVE', step: 1 })
    machine.send({ type: 'SELECT' })
    expect(onSelect).not.toHaveBeenCalled()
    expect(machine.getState().open).toBe(true)
  })

  it('a checkbox reports the state it asks for; a radio always asks for true', () => {
    const onSelect = vi.fn()
    const machine = createMenuMachine({ id: 'm', items, onSelect, closeOnSelect: false })
    machine.send({ type: 'OPEN' })
    machine.send({ type: 'SELECT', index: 2 })
    machine.send({ type: 'SELECT', index: 3 })
    machine.send({ type: 'SELECT', index: 0 })
    expect(onSelect.mock.calls.map(([value, details]) => [value, details.checked])).toEqual([
      ['grid', false],
      ['compact', true],
      ['edit', undefined],
    ])
    expect(onSelect.mock.calls[2][1]).not.toHaveProperty('checked')
    expect(machine.getState().open).toBe(true)
  })

  it('an item can override closeOnSelect either way', () => {
    const keep = run(initialState({ id: 'm', items: [{ value: 'a', label: 'A', closeOnSelect: false }] }), { type: 'OPEN' }, { type: 'SELECT', index: 0 })
    expect(keep.open).toBe(true)
    const close = run(
      initialState({ id: 'm', closeOnSelect: false, items: [{ value: 'a', label: 'A', closeOnSelect: true }] }),
      { type: 'OPEN' },
      { type: 'SELECT', index: 0 }
    )
    expect(close.open).toBe(false)
  })

  it('re-selecting the same item is heard again', () => {
    const onSelect = vi.fn()
    const machine = createMenuMachine({ id: 'm', items, onSelect, closeOnSelect: false })
    machine.send({ type: 'OPEN' })
    machine.send({ type: 'SELECT', index: 0 })
    machine.send({ type: 'SELECT', index: 0 })
    expect(onSelect).toHaveBeenCalledTimes(2)
  })
})

describe('menu machine — controlled', () => {
  it('reports a request; the highlight lands when the owner opens it', () => {
    const onOpenChange = vi.fn()
    const machine = createMenuMachine({ id: 'm', items, open: false, onOpenChange })
    machine.send({ type: 'OPEN', focus: 'last' })
    expect(machine.getState().open).toBe(false)
    expect(onOpenChange).toHaveBeenCalledWith(true, { reason: 'trigger' })
    machine.send({ type: 'SYNC_OPEN', open: true })
    expect(machine.getState()).toMatchObject({ open: true, highlightedIndex: 4 })
    expect(onOpenChange).toHaveBeenCalledTimes(1)
  })

  it('new items keep the highlight inside the list', () => {
    const open = run(base, { type: 'OPEN', focus: 'last' })
    expect(run(open, { type: 'SYNC_ITEMS', items: items.slice(0, 1) }).highlightedIndex).toBe(0)
  })
})

describe('menu connect', () => {
  it('is a menu button: the trigger says it opens a menu, and names it', () => {
    const api = connect(run(base, { type: 'OPEN', focus: 'first' }), () => {}, identity)
    expect(api.triggerProps).toMatchObject({ 'aria-haspopup': 'menu', 'aria-expanded': 'true', 'aria-controls': 'm-content' })
    expect(api.triggerProps['data-scope']).toBeUndefined()
    expect(api.contentProps).toMatchObject({ role: 'menu', popover: 'manual', 'aria-labelledby': 'm-trigger', tabIndex: -1 })
    expect(api.highlightedId).toBe('m-item-0')
  })

  it('an explicit label replaces the trigger as the name', () => {
    const api = connect(base, () => {}, identity, { label: 'Row actions' })
    expect(api.contentProps['aria-label']).toBe('Row actions')
    expect(api.contentProps['aria-labelledby']).toBeUndefined()
  })

  it('gives each kind of item its role and state', () => {
    const api = connect(base, () => {}, identity)
    const [edit, duplicate, grid, compact, remove] = api.items.map((item, index) => api.getItemProps(item, index))
    expect(edit).toMatchObject({ role: 'menuitem', tabIndex: -1 })
    expect(edit['aria-checked']).toBeUndefined()
    expect(duplicate).toMatchObject({ 'aria-disabled': 'true', 'data-disabled': '' })
    expect(grid).toMatchObject({ role: 'menuitemcheckbox', 'aria-checked': 'true', 'data-state': 'checked' })
    expect(compact).toMatchObject({ role: 'menuitemradio', 'aria-checked': 'false', 'data-state': 'unchecked' })
    expect(remove).toMatchObject({ 'data-tone': 'danger' })
  })

  it('a link item keeps its href unless disabled', () => {
    const links = initialState({
      id: 'm',
      items: [
        { value: 'docs', label: 'Docs', href: '/docs' },
        { value: 'old', label: 'Old docs', href: '/old', disabled: true },
      ],
    })
    const api = connect(links, () => {}, identity)
    expect(api.getItemProps(api.items[0], 0).href).toBe('/docs')
    expect(api.getItemProps(api.items[1], 1).href).toBeUndefined()
  })

  it('numbers items across groups, and names a group by its label', () => {
    const nodes = menuNodes(items)
    expect(nodes.map((node) => node.kind)).toEqual(['item', 'item', 'separator', 'group', 'item'])
    const group = nodes[3] as Extract<(typeof nodes)[number], { kind: 'group' }>
    expect(group.items.map((entry) => entry.index)).toEqual([2, 3])
    const api = connect(base, () => {}, identity)
    expect(api.getGroupProps(group)['aria-labelledby']).toBe(api.getGroupLabelProps(group).id)
  })

  it('Enter on an item activates it through a click; Tab closes', () => {
    // No DOM in this project: just enough of an event and an item.
    const send = vi.fn()
    const api = connect(run(base, { type: 'OPEN', focus: 'first' }), send, identity)
    const click = vi.fn()
    const item = { click }
    const key = (name: string, target: unknown = null) => {
      const event = { key: name, target, defaultPrevented: false, preventDefault: () => (event.defaultPrevented = true) }
      return event
    }
    const enter = key('Enter', { closest: () => item })
    api.contentProps.onKeyDown(enter as unknown as KeyboardEvent)
    expect(click).toHaveBeenCalled()
    expect(enter.defaultPrevented).toBe(true)

    api.contentProps.onKeyDown(key('Tab') as unknown as KeyboardEvent)
    expect(send).toHaveBeenCalledWith({ type: 'CLOSE', reason: 'tab' })
  })
})
