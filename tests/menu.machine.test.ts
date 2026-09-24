import { describe, expect, it, vi } from 'vitest'
import { connect, gracePolygon, menuNodes, pointInPolygon } from '../packages/core/src/components/menu'
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
  { value: 'delete', label: 'Delete', destructive: true },
]

const run = (state: MenuState, ...events: MenuEvent[]) => events.reduce(reducer, state)
const base = initialState({ id: 'm', items })

describe('menu machine — opening and the highlight', () => {
  it('a pointer opens it with nothing highlighted; the keyboard lands on an edge', () => {
    expect(run(base, { type: 'TOGGLE', focus: 'none' })).toMatchObject({ open: true, path: [-1] })
    expect(run(base, { type: 'OPEN', focus: 'first' }).path[0]).toBe(0)
    expect(run(base, { type: 'OPEN', focus: 'last' }).path[0]).toBe(4)
  })

  it('arrows wrap, and walk disabled items and groups as one list; separators are not stops', () => {
    const open = run(base, { type: 'OPEN', focus: 'first' })
    const steps = [1, 1, 1, 1, 1].reduce<number[]>((seen, step) => {
      const last = seen.length ? seen[seen.length - 1] : 0
      const state = run({ ...open, path: [last] }, { type: 'HIGHLIGHT_MOVE', step })
      return [...seen, state.path[0]]
    }, [])
    expect(steps).toEqual([1, 2, 3, 4, 0])
    expect(run(open, { type: 'HIGHLIGHT_MOVE', step: -1 }).path[0]).toBe(4)
  })

  it('closing forgets the highlight, so the next open lands afresh', () => {
    const state = run(base, { type: 'OPEN', focus: 'last' }, { type: 'CLOSE', reason: 'escape' }, { type: 'TOGGLE', focus: 'none' })
    expect(state.path[0]).toBe(-1)
  })

  it('typeahead finds an item by its label, disabled ones included', () => {
    const open = run(base, { type: 'OPEN', focus: 'none' })
    expect(run(open, { type: 'TYPE', char: 'd', now: 1000 }).path[0]).toBe(1)
    expect(run(open, { type: 'TYPE', char: 's', now: 1000 }).path[0]).toBe(2)
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
    expect(machine.getState()).toMatchObject({ open: true, path: [4] })
    expect(onOpenChange).toHaveBeenCalledTimes(1)
  })

  it('new items keep the highlight inside the list', () => {
    const open = run(base, { type: 'OPEN', focus: 'last' })
    expect(run(open, { type: 'SYNC_ITEMS', items: items.slice(0, 1) }).path[0]).toBe(0)
  })
})

describe('menu connect', () => {
  it('is a menu button: the trigger says it opens a menu, and names it', () => {
    const api = connect(run(base, { type: 'OPEN', focus: 'first' }), () => {}, identity)
    expect(api.triggerProps).toMatchObject({ 'aria-haspopup': 'menu', 'aria-expanded': 'true', 'aria-controls': 'm-content' })
    expect(api.triggerProps['data-scope']).toBeUndefined()
    expect(api.contentProps).toMatchObject({ role: 'menu', popover: 'manual', 'aria-labelledby': 'm-trigger', tabIndex: -1 })
    expect(api.focusTarget).toEqual({ contentId: 'm-content', itemId: 'm-item-0' })
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
    expect(remove).toMatchObject({ 'data-destructive': '' })
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

describe('menu machine — submenus', () => {
  // File: New, Open Recent > (a.txt, b.txt, More > (c.txt)), Export (a disabled submenu), Quit
  const tree: MenuEntry[] = [
    { value: 'new', label: 'New' },
    {
      type: 'submenu',
      value: 'recent',
      label: 'Open Recent',
      items: [
        { value: 'a', label: 'a.txt' },
        { value: 'b', label: 'b.txt' },
        { type: 'submenu', value: 'more', label: 'More', items: [{ value: 'c', label: 'c.txt' }] },
      ],
    },
    { type: 'submenu', value: 'export', label: 'Export', disabled: true, items: [{ value: 'pdf', label: 'PDF' }] },
    { value: 'quit', label: 'Quit' },
  ]
  const closed = initialState({ id: 'f', items: tree })
  const onRecent = run(closed, { type: 'OPEN', focus: 'first' }, { type: 'HIGHLIGHT_MOVE', step: 1 })
  const at = (x: number, y: number, now = 0) => ({ x, y, now })

  it('ArrowRight opens a submenu on its first row and moves focus in; ArrowLeft goes back to its row', () => {
    const inside = run(onRecent, { type: 'SUBMENU_OPEN' })
    expect(inside).toMatchObject({ path: [1, 0], focusLevel: 1 })
    const deeper = run(inside, { type: 'HIGHLIGHT_EDGE', edge: 'last' }, { type: 'SUBMENU_OPEN' })
    expect(deeper).toMatchObject({ path: [1, 2, 0], focusLevel: 2 })
    expect(run(deeper, { type: 'SUBMENU_CLOSE' })).toMatchObject({ path: [1, 2], focusLevel: 1 })
    expect(run(deeper, { type: 'SUBMENU_CLOSE' }, { type: 'SUBMENU_CLOSE' })).toMatchObject({ path: [1], focusLevel: 0 })
  })

  it('Escape closes one level at a time, then the menu', () => {
    const once = run(onRecent, { type: 'SUBMENU_OPEN' }, { type: 'ESCAPE' })
    expect(once).toMatchObject({ open: true, path: [1], focusLevel: 0 })
    expect(run(once, { type: 'ESCAPE' })).toMatchObject({ open: false, path: [], intent: { reason: 'escape' } })
  })

  it('arrows walk the level that holds focus; moving off a submenu row closes its submenu', () => {
    expect(run(onRecent, { type: 'SUBMENU_OPEN' }, { type: 'HIGHLIGHT_MOVE', step: 1 }).path).toEqual([1, 1])
    const hovered = run(onRecent, { type: 'HIGHLIGHT', level: 0, index: 1, pointer: at(0, 0) })
    expect(hovered.path).toEqual([1, -1])
    expect(run(hovered, { type: 'HIGHLIGHT_MOVE', step: 1 }).path).toEqual([2])
  })

  it('a disabled submenu is reachable but does not open', () => {
    const onExport = run(onRecent, { type: 'HIGHLIGHT_MOVE', step: 1 })
    expect(onExport.path).toEqual([2])
    expect(run(onExport, { type: 'SUBMENU_OPEN' })).toBe(onExport)
    expect(run(onExport, { type: 'SELECT' })).toBe(onExport)
    expect(run(onExport, { type: 'HIGHLIGHT', level: 0, index: 2, pointer: at(0, 0) }).path).toEqual([2])
  })

  it('a pointer on a submenu row opens it and focus stays on the row; a real click changes nothing more', () => {
    const hovered = run(closed, { type: 'TOGGLE', focus: 'none' }, { type: 'HIGHLIGHT', level: 0, index: 1, pointer: at(0, 0) })
    expect(hovered).toMatchObject({ path: [1, -1], focusLevel: 0 })
    expect(run(hovered, { type: 'SELECT', level: 0, index: 1, pointer: true })).toBe(hovered)
    // Enter, or a click made by the keyboard, moves focus in.
    expect(run(hovered, { type: 'SELECT', level: 0, index: 1 })).toMatchObject({ path: [1, 0], focusLevel: 1 })
    // With focus still on the row, ArrowLeft and Escape close the submenu the pointer opened.
    expect(run(hovered, { type: 'SUBMENU_CLOSE' })).toMatchObject({ open: true, path: [1] })
  })

  it('leaving the row of an open submenu keeps it; leaving any other row drops the highlight', () => {
    const hovered = run(onRecent, { type: 'HIGHLIGHT', level: 0, index: 1, pointer: at(0, 0) })
    expect(run(hovered, { type: 'UNHIGHLIGHT', level: 0, index: 1 })).toBe(hovered)
    const onNew = run(onRecent, { type: 'HIGHLIGHT', level: 0, index: 0, pointer: at(0, 0) })
    expect(run(onNew, { type: 'UNHIGHLIGHT', level: 0, index: 0 }).path).toEqual([-1])
  })

  it('a pointer crossing sibling rows inside the grace corridor does not close the submenu', () => {
    // The submenu sits to the right, x 200 to 300, y 20 to 120; the pointer left its row at (150, 30).
    const polygon = gracePolygon({ x: 150, y: 30 }, { left: 200, right: 300, top: 20, bottom: 120 })
    const hovered = run(onRecent, { type: 'HIGHLIGHT', level: 0, index: 1, pointer: at(150, 30) })
    const graced = run(hovered, { type: 'GRACE', grace: { level: 0, polygon, until: 300 } })
    // On the way down and right, over the Export row: ignored.
    expect(run(graced, { type: 'HIGHLIGHT', level: 0, index: 2, pointer: at(175, 60, 100) }).path).toEqual([1, -1])
    // Outside the corridor, or too late: Export takes the highlight and the submenu closes.
    expect(run(graced, { type: 'HIGHLIGHT', level: 0, index: 2, pointer: at(120, 60, 100) }).path).toEqual([2])
    expect(run(graced, { type: 'HIGHLIGHT', level: 0, index: 2, pointer: at(175, 60, 400) }).path).toEqual([2])
    // Arriving in the submenu ends the corridor.
    expect(run(graced, { type: 'HIGHLIGHT', level: 1, index: 0, pointer: at(210, 30, 100) })).toMatchObject({
      path: [1, 0],
      focusLevel: 1,
      grace: null,
    })
  })

  it('choosing a row in a submenu reports it and closes the whole menu', () => {
    const onSelect = vi.fn()
    const machine = createMenuMachine({ id: 'f', items: tree, onSelect })
    machine.send({ type: 'OPEN', focus: 'first' })
    machine.send({ type: 'HIGHLIGHT_MOVE', step: 1 })
    machine.send({ type: 'SUBMENU_OPEN' })
    machine.send({ type: 'HIGHLIGHT_EDGE', edge: 'last' })
    machine.send({ type: 'SUBMENU_OPEN' })
    machine.send({ type: 'SELECT' })
    expect(onSelect).toHaveBeenCalledWith('c', { item: { value: 'c', label: 'c.txt' } })
    expect(machine.getState()).toMatchObject({ open: false, path: [] })
  })

  it('typeahead searches the level that holds focus', () => {
    expect(run(onRecent, { type: 'SUBMENU_OPEN' }, { type: 'TYPE', char: 'm', now: 5000 }).path).toEqual([1, 2])
  })

  it('new items cut the path where a row is no longer a submenu', () => {
    const deeper = run(onRecent, { type: 'SUBMENU_OPEN' }, { type: 'HIGHLIGHT_EDGE', edge: 'last' }, { type: 'SUBMENU_OPEN' })
    const flattened = tree.map((entry) =>
      entry.type === 'submenu' && entry.value === 'recent' ? { value: 'recent', label: 'Recent' } : entry
    )
    expect(run(deeper, { type: 'SYNC_ITEMS', items: flattened })).toMatchObject({ path: [1], focusLevel: 0 })
  })

  it('names where focus belongs, and wires a submenu row to its submenu', () => {
    const api = connect(run(onRecent, { type: 'SUBMENU_OPEN' }), () => {}, identity)
    expect(api.focusTarget).toEqual({ contentId: 'f-content-1', itemId: 'f-item-1-0' })
    expect(api.getItemProps(api.items[1], [1])).toMatchObject({
      role: 'menuitem',
      'aria-haspopup': 'menu',
      'aria-expanded': 'true',
      'aria-controls': 'f-content-1',
      'data-state': 'open',
      'data-highlighted': '',
    })
    expect(api.getSubmenuProps([1])).toMatchObject({ id: 'f-content-1', role: 'menu', 'aria-labelledby': 'f-item-1', 'data-level': '1' })
    expect(api.getItemProps(api.items[2], [2])).toMatchObject({ 'aria-expanded': 'false', 'aria-disabled': 'true' })
  })

  it('ArrowRight and ArrowLeft leave the decision to the reducer, which does nothing where there is no submenu', () => {
    const send = vi.fn()
    const onNew = run(closed, { type: 'OPEN', focus: 'first' })
    const api = connect(onNew, send, identity)
    const key = (name: string) => ({ key: name, target: null, preventDefault: () => {} }) as unknown as KeyboardEvent
    api.contentProps.onKeyDown(key('ArrowRight'))
    api.contentProps.onKeyDown(key('ArrowLeft'))
    expect(send.mock.calls.map(([event]) => event.type)).toEqual(['SUBMENU_OPEN', 'SUBMENU_CLOSE'])
    // The same state back: a menubar reads that as "move to the next menu".
    expect(run(onNew, { type: 'SUBMENU_OPEN' })).toBe(onNew)
    expect(run(onNew, { type: 'SUBMENU_CLOSE' })).toBe(onNew)
  })
})

describe('menu grace geometry', () => {
  it('a point is inside the corridor towards the submenu, not behind or beside it', () => {
    const polygon = gracePolygon({ x: 100, y: 50 }, { left: 150, right: 250, top: 0, bottom: 200 })
    expect(pointInPolygon({ x: 130, y: 60 }, polygon)).toBe(true)
    expect(pointInPolygon({ x: 130, y: 190 }, polygon)).toBe(false)
    expect(pointInPolygon({ x: 80, y: 50 }, polygon)).toBe(false)
    // A submenu that flipped to the left.
    const left = gracePolygon({ x: 100, y: 50 }, { left: 0, right: 60, top: 0, bottom: 200 })
    expect(pointInPolygon({ x: 70, y: 60 }, left)).toBe(true)
  })
})
