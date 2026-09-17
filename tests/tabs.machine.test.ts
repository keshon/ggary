import { describe, expect, it, vi } from 'vitest'
import { connect, createTabsMachine, initialState, reducer, type TabItem, type TabsEvent, type TabsState } from '../packages/core/src/components/tabs'

const identity = <T,>(props: T) => props

const items: TabItem[] = [
  { value: 'geometry', label: 'Geometry' },
  { value: 'material', label: 'Material' },
  { value: 'physics', label: 'Physics', disabled: true },
  { value: 'scripts', label: 'Scripts' },
]

const run = (state: TabsState, ...events: TabsEvent[]) => events.reduce(reducer, state)
const base = initialState({ id: 't', items })

describe('tabs machine — selection', () => {
  it('starts on the default, or on the first enabled tab', () => {
    expect(base.value).toBe('geometry')
    expect(initialState({ id: 't', items, defaultValue: 'scripts' }).value).toBe('scripts')
    expect(initialState({ id: 't', items, defaultValue: 'physics' }).value).toBe('geometry')
    expect(initialState({ id: 't', items: [{ value: 'a', label: 'A', disabled: true }, { value: 'b', label: 'B' }] }).value).toBe('b')
  })

  it('selects on a press; a disabled tab and the selected tab change nothing', () => {
    expect(run(base, { type: 'SELECT', value: 'material' }).value).toBe('material')
    expect(run(base, { type: 'SELECT', value: 'physics' })).toBe(base)
    expect(run(base, { type: 'SELECT', value: 'geometry' })).toBe(base)
  })

  it('automatic: arrows move and select, skip disabled tabs, and wrap', () => {
    const second = run(base, { type: 'MOVE', step: 1 })
    expect(second).toMatchObject({ value: 'material', focus: { value: 'material', nonce: 1 } })
    expect(run(second, { type: 'MOVE', step: 1 }).value).toBe('scripts')
    expect(run(base, { type: 'MOVE', step: -1 }).value).toBe('scripts')
    expect(run(base, { type: 'EDGE', edge: 'last' }).value).toBe('scripts')
  })

  it('manual: arrows move focus only; Enter selects the focused tab', () => {
    const manual = initialState({ id: 't', items, activation: 'manual' })
    const moved = run(manual, { type: 'MOVE', step: 1 })
    expect(moved).toMatchObject({ value: 'geometry', focus: { value: 'material' } })
    expect(run(moved, { type: 'ACTIVATE' }).value).toBe('material')
  })

  it('controlled: reports what the user picked and shows what the owner passes', () => {
    const onValueChange = vi.fn()
    const machine = createTabsMachine({ id: 't', items, value: 'geometry', onValueChange })
    machine.send({ type: 'SELECT', value: 'scripts' })
    expect(onValueChange).toHaveBeenCalledWith('scripts')
    expect(machine.getState().value).toBe('geometry')
    machine.send({ type: 'SYNC_VALUE', value: 'scripts' })
    expect(machine.getState().value).toBe('scripts')
    expect(onValueChange).toHaveBeenCalledTimes(1)
  })

  it('focus arriving by a press or Tab moves the tab stop without asking to move focus', () => {
    expect(run(base, { type: 'FOCUS', value: 'scripts' }).focus).toEqual({ value: 'scripts', nonce: 0 })
  })
})

describe('tabs machine — closing', () => {
  const open: TabItem[] = [
    { value: 'a.css', label: 'a.css', closable: true },
    { value: 'b.css', label: 'b.css', closable: true, modified: true },
    { value: 'c.css', label: 'c.css', closable: true },
    { value: 'pinned', label: 'Pinned' },
  ]

  it('a close is a request: reported, the items untouched', () => {
    const onClose = vi.fn()
    const machine = createTabsMachine({ id: 't', items: open, defaultValue: 'b.css', onClose })
    machine.send({ type: 'CLOSE', value: 'b.css' })
    expect(onClose).toHaveBeenCalledWith('b.css')
    expect(machine.getState().items).toBe(open)
    machine.send({ type: 'CLOSE', value: 'pinned' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closing the focused tab aims focus at its neighbour; closing another leaves focus', () => {
    const onB = run(initialState({ id: 't', items: open }), { type: 'MOVE', step: 1 })
    expect(run(onB, { type: 'CLOSE' }).focus).toEqual({ value: 'c.css', nonce: 2 })
    expect(run(onB, { type: 'CLOSE', value: 'a.css' }).focus).toEqual(onB.focus)
  })

  it('when the owner removes the selected tab, its neighbour is selected and reported', () => {
    const onValueChange = vi.fn()
    const machine = createTabsMachine({ id: 't', items: open, defaultValue: 'c.css', onValueChange })
    machine.send({ type: 'SYNC_ITEMS', items: open.filter((item) => item.value !== 'c.css') })
    expect(machine.getState().value).toBe('pinned')
    expect(onValueChange).toHaveBeenCalledWith('pinned')
    machine.send({ type: 'SYNC_ITEMS', items: [open[0]] })
    expect(machine.getState().value).toBe('a.css')
  })

  it('removing a background tab keeps the selection and says nothing', () => {
    const onValueChange = vi.fn()
    const machine = createTabsMachine({ id: 't', items: open, defaultValue: 'a.css', onValueChange })
    machine.send({ type: 'SYNC_ITEMS', items: open.slice(0, 2) })
    expect(machine.getState().value).toBe('a.css')
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('tabs that arrive after construction get a selection', () => {
    const empty = initialState({ id: 't' })
    expect(empty.value).toBeNull()
    expect(run(empty, { type: 'SYNC_ITEMS', items }).value).toBe('geometry')
  })
})

describe('tabs connect', () => {
  it('wires the tab list, tabs and panels to each other, with one tab stop', () => {
    const api = connect(base, () => {}, identity, { label: 'Object properties' })
    expect(api.listProps).toMatchObject({ role: 'tablist', 'aria-label': 'Object properties' })
    expect(api.listProps['aria-orientation']).toBeUndefined()
    const [geometry, material, physics] = items.map((item) => api.getTabProps(item))
    expect(geometry).toMatchObject({ role: 'tab', 'aria-selected': 'true', tabIndex: 0, 'aria-controls': 't-panel-geometry' })
    expect(material).toMatchObject({ 'aria-selected': 'false', tabIndex: -1, 'data-state': 'inactive' })
    expect(physics).toMatchObject({ 'aria-disabled': 'true' })
    expect(api.getPanelProps(items[0])).toMatchObject({ role: 'tabpanel', 'aria-labelledby': 't-tab-geometry', hidden: false, tabIndex: 0 })
    expect(api.getPanelProps(items[1]).hidden).toBe(true)
  })

  it('a vertical list says so and walks with ArrowDown', () => {
    const send = vi.fn()
    const api = connect(initialState({ id: 't', items, orientation: 'vertical' }), send, identity)
    expect(api.listProps['aria-orientation']).toBe('vertical')
    const key = (name: string) => ({ key: name, preventDefault: () => {} }) as unknown as KeyboardEvent
    api.getTabProps(items[0]).onKeyDown(key('ArrowDown'))
    api.getTabProps(items[0]).onKeyDown(key('ArrowRight'))
    expect(send.mock.calls).toEqual([[{ type: 'MOVE', step: 1 }]])
  })

  it('without panels, tabs point at nothing', () => {
    const api = connect(base, () => {}, identity, { panels: false })
    expect(api.getTabProps(items[0])['aria-controls']).toBeUndefined()
  })

  it('makes ids from any value', () => {
    const api = connect(base, () => {}, identity)
    expect(api.ids.tab('src/a b.css')).toBe('t-tab-src_2fa_20b_2ecss')
  })

  it('a close button names its tab, stays out of the tab order, and does not select', () => {
    const send = vi.fn()
    const item = { value: 'b.css', label: 'b.css', closable: true }
    const api = connect(initialState({ id: 't', items: [item] }), send, identity)
    const close = api.getCloseProps(item)
    expect(close).toMatchObject({ 'aria-label': 'Close b.css', tabIndex: -1, type: 'button' })
    const stopPropagation = vi.fn()
    close.onClick({ stopPropagation } as unknown as MouseEvent)
    expect(stopPropagation).toHaveBeenCalled()
    expect(send).toHaveBeenCalledWith({ type: 'CLOSE', value: 'b.css' })
  })
})
