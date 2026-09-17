import { describe, expect, it, vi } from 'vitest'
import { connect, createMenubarMachine, initialState, reducer, type MenubarEvent, type MenubarMenu, type MenubarState } from '../packages/core/src/components/menubar'
import type { MenuEvent } from '../packages/core/src/components/menu'
import { matchesMnemonic, parseMnemonic } from '../packages/core/src/utils/mnemonic'

const identity = <T,>(props: T) => props

const menus: MenubarMenu[] = [
  {
    value: 'file',
    label: '&File',
    items: [
      { value: 'new', label: 'New' },
      { type: 'submenu', value: 'recent', label: 'Open Recent', items: [{ value: 'a', label: 'a.txt' }] },
      { value: 'quit', label: 'Quit' },
    ],
  },
  { value: 'edit', label: '&Edit', items: [{ value: 'undo', label: 'Undo' }, { value: 'redo', label: 'Redo' }] },
  { value: 'tools', label: '&Tools', disabled: true, items: [{ value: 'lint', label: 'Lint' }] },
  { value: 'help', label: '&Help', items: [{ value: 'about', label: 'About' }] },
]

const run = (state: MenubarState, ...events: MenubarEvent[]) => events.reduce(reducer, state)
const base = initialState({ id: 'bar', menus })
const menu = (event: MenuEvent): MenubarEvent => ({ type: 'MENU', event })

describe('menubar machine — the bar', () => {
  it('has one tab stop, which the arrows move over every item, disabled ones too, wrapping', () => {
    expect(base.focusIndex).toBe(0)
    expect(run(base, { type: 'MOVE', step: 1 }, { type: 'MOVE', step: 1 }).focusIndex).toBe(2)
    expect(run(base, { type: 'MOVE', step: -1 }).focusIndex).toBe(3)
    expect(run(base, { type: 'EDGE', edge: 'last' }).focusIndex).toBe(3)
  })

  it('opens a menu from the keyboard on its first or last row; a disabled one does not open', () => {
    expect(run(base, { type: 'OPEN', index: 1, focus: 'first' })).toMatchObject({ openIndex: 1, focusIndex: 1, menu: { open: true, path: [0] } })
    expect(run(base, { type: 'OPEN', index: 1, focus: 'last' }).menu.path).toEqual([1])
    expect(run(base, { type: 'OPEN', index: 2, focus: 'first' })).toBe(base)
  })

  it('a press toggles; while one is open, hovering another opens that one instead', () => {
    const open = run(base, { type: 'TOGGLE', index: 0 })
    expect(open).toMatchObject({ openIndex: 0, menu: { open: true, path: [-1], id: 'bar-menu-0' } })
    expect(run(open, { type: 'TOGGLE', index: 0 })).toMatchObject({ openIndex: -1, menu: { open: false } })
    expect(run(open, { type: 'HOVER', index: 1 })).toMatchObject({ openIndex: 1, focusIndex: 1, menu: { id: 'bar-menu-1', path: [-1] } })
    // Nothing open: hovering is just hovering.
    expect(run(base, { type: 'HOVER', index: 1 })).toBe(base)
    // A disabled menu under the pointer keeps the open one.
    expect(run(open, { type: 'HOVER', index: 2 })).toBe(open)
  })
})

describe('menubar machine — moving between open menus', () => {
  const inFile = run(base, { type: 'OPEN', index: 0, focus: 'first' })

  it('ArrowRight on a row with no submenu opens the next menu on its first row, skipping disabled ones and wrapping', () => {
    const edit = run(inFile, menu({ type: 'SUBMENU_OPEN' }))
    expect(edit).toMatchObject({ openIndex: 1, menu: { path: [0] } })
    const help = run(edit, menu({ type: 'SUBMENU_OPEN' }))
    expect(help.openIndex).toBe(3)
    expect(run(help, menu({ type: 'SUBMENU_OPEN' })).openIndex).toBe(0)
  })

  it('ArrowRight on a submenu row opens the submenu; ArrowRight inside it, on a row with none, moves along the bar', () => {
    const onRecent = run(inFile, menu({ type: 'HIGHLIGHT_MOVE', step: 1 }), menu({ type: 'SUBMENU_OPEN' }))
    expect(onRecent).toMatchObject({ openIndex: 0, menu: { path: [1, 0], focusLevel: 1 } })
    expect(run(onRecent, menu({ type: 'SUBMENU_OPEN' })).openIndex).toBe(1)
  })

  it('ArrowLeft closes a submenu first, then moves to the previous menu', () => {
    const onRecent = run(inFile, menu({ type: 'HIGHLIGHT_MOVE', step: 1 }), menu({ type: 'SUBMENU_OPEN' }))
    const back = run(onRecent, menu({ type: 'SUBMENU_CLOSE' }))
    expect(back).toMatchObject({ openIndex: 0, menu: { path: [1], focusLevel: 0 } })
    expect(run(back, menu({ type: 'SUBMENU_CLOSE' })).openIndex).toBe(3)
  })

  it('Escape closes the menu and keeps the bar item as the tab stop', () => {
    const edit = run(inFile, menu({ type: 'SUBMENU_OPEN' }))
    expect(run(edit, menu({ type: 'ESCAPE' }))).toMatchObject({ openIndex: -1, focusIndex: 1, menu: { open: false } })
  })
})

describe('menubar machine — callbacks', () => {
  it('reports the chosen item with the menu it came from, then the close', () => {
    const calls: unknown[] = []
    const machine = createMenubarMachine({
      id: 'bar',
      menus,
      onSelect: (value, details) => calls.push(['select', value, details.menu]),
      onOpenChange: (open) => calls.push(['open', open]),
    })
    machine.send({ type: 'OPEN', index: 1, focus: 'last' })
    machine.send({ type: 'MENU', event: { type: 'SELECT' } })
    expect(calls).toEqual([['open', 'edit'], ['select', 'redo', 'edit'], ['open', null]])
  })

  it('switching menus reports the new one, and nothing is chosen on the way', () => {
    const onSelect = vi.fn()
    const onOpenChange = vi.fn()
    const machine = createMenubarMachine({ id: 'bar', menus, onSelect, onOpenChange })
    machine.send({ type: 'TOGGLE', index: 0 })
    machine.send({ type: 'HOVER', index: 3 })
    expect(onOpenChange.mock.calls).toEqual([['file'], ['help']])
    expect(onSelect).not.toHaveBeenCalled()
  })
})

describe('menubar machine — access keys', () => {
  it('parses & markers: the first marks the key, && is an ampersand', () => {
    expect(parseMnemonic('&File')).toEqual({ text: 'File', index: 0, key: 'F' })
    expect(parseMnemonic('Save &As')).toEqual({ text: 'Save As', index: 5, key: 'A' })
    expect(parseMnemonic('Salt && &Pepper')).toEqual({ text: 'Salt & Pepper', index: 7, key: 'P' })
    expect(parseMnemonic('Plain')).toEqual({ text: 'Plain', index: -1, key: null })
  })

  it('matches by the character typed, or by the physical key on another layout', () => {
    expect(matchesMnemonic('F', 'f')).toBe(true)
    expect(matchesMnemonic('F', 'а', 'KeyF')).toBe(true)
    expect(matchesMnemonic('Ф', 'ф', 'KeyA')).toBe(true)
    expect(matchesMnemonic('F', 'e', 'KeyE')).toBe(false)
  })

  it('Alt+key opens its menu on the first row and underlines the keys; a disabled menu or no match does nothing', () => {
    expect(run(base, { type: 'MNEMONIC', key: 'e', code: 'KeyE' })).toMatchObject({ openIndex: 1, mnemonics: true, menu: { path: [0] } })
    expect(run(base, { type: 'MNEMONIC', key: 't', code: 'KeyT' })).toBe(base)
    expect(run(base, { type: 'MNEMONIC', key: 'z', code: 'KeyZ' })).toBe(base)
  })

  it('F10 closes any menu, goes to the first item and underlines the keys', () => {
    const inHelp = run(base, { type: 'OPEN', index: 3, focus: 'first' })
    expect(run(inHelp, { type: 'ENTER_BAR' })).toMatchObject({ openIndex: -1, focusIndex: 0, mnemonics: true, menu: { open: false } })
  })

  it('closing the menu hides the underlines', () => {
    const open = run(base, { type: 'MNEMONIC', key: 'f' })
    expect(run(open, menu({ type: 'ESCAPE' })).mnemonics).toBe(false)
  })
})

describe('menubar connect', () => {
  it('is a menubar of menu items that each open a menu, with one tab stop', () => {
    const api = connect(run(base, { type: 'OPEN', index: 1, focus: 'first' }), () => {}, identity, { label: 'Application', mnemonics: true })
    expect(api.rootProps).toMatchObject({ role: 'menubar', 'aria-label': 'Application', 'data-scope': 'menubar', 'data-part': 'root' })
    const [file, edit, tools] = menus.map((m, i) => api.getItemProps(m, i))
    expect(file).toMatchObject({ role: 'menuitem', 'aria-haspopup': 'menu', 'aria-expanded': 'false', tabIndex: -1, 'aria-keyshortcuts': 'Alt+F' })
    expect(edit).toMatchObject({ 'aria-expanded': 'true', 'aria-controls': 'bar-menu-1-content', tabIndex: 0, 'data-state': 'open' })
    expect(tools).toMatchObject({ 'aria-disabled': 'true' })
    // The open menu is labelled by its bar item.
    expect(api.menu.contentProps['aria-labelledby']).toBe(edit.id)
  })

  it('splits a label around its access key, and names no key shortcut unless access keys are on', () => {
    const api = connect(base, () => {}, identity)
    expect(api.labelOf(menus[0])).toEqual({ text: 'File', before: '', key: 'F', after: 'ile' })
    expect(api.labelOf({ value: 'x', label: 'Plain', items: [] })).toEqual({ text: 'Plain', before: 'Plain', key: null, after: '' })
    expect(api.getItemProps(menus[0], 0)['aria-keyshortcuts']).toBeUndefined()
  })
})
