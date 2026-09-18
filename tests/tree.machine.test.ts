import { describe, expect, it } from 'vitest'
import { connect, createTreeMachine, pathTo, tabStop, visibleRows } from '../packages/core/src/components/tree'
import { files } from './conformance/files'

/**
 * The tree with no DOM: the rows an open branch shows, the APG's keys walking
 * them, the focus climbing out of a branch that closes, and the three ways of
 * choosing.
 */

const same = (props: Record<string, unknown>) => props

const tree = (config: Partial<Parameters<typeof createTreeMachine>[0]> = {}) => {
  const changes: string[][] = []
  const opened: string[][] = []
  const machine = createTreeMachine({ id: 't', items: files, onValueChange: (value) => changes.push(value), onExpandedChange: (value) => opened.push(value), ...config })
  const focused = () => tabStop(machine.getState())
  const labels = () => visibleRows(files, machine.getState().expanded).map((row) => row.node.label)
  return { machine, changes, opened, focused, labels, send: machine.send }
}

describe('tree', () => {
  it('shows the roots, and a branch’s children when it is open, each with its level and place', () => {
    expect(visibleRows(files, []).map((row) => row.node.value)).toEqual(['src', 'secrets', 'tests', 'readme'])
    const rows = visibleRows(files, ['src', 'src/lib'])
    expect(rows.map((row) => `${row.node.label}:${row.level}:${row.posinset}/${row.setsize}`)).toEqual([
      'src:1:1/4',
      'app:2:1/3',
      'lib:2:2/3',
      'api.ts:3:1/1',
      'index.ts:2:3/3',
      'secrets:1:2/4',
      'tests:1:3/4',
      'README.md:1:4/4',
    ])
    expect(pathTo(files, 'src/lib/api.ts')).toEqual(['src', 'src/lib', 'src/lib/api.ts'])
  })

  it('Right opens a branch, then steps onto its first child; Left steps up, then closes', () => {
    const { send, focused, labels, opened } = tree()
    expect(focused()).toBe('src')
    send({ type: 'INTO' })
    expect(labels()).toContain('app')
    expect(focused()).toBe('src')
    send({ type: 'INTO' })
    expect(focused()).toBe('src/app')
    send({ type: 'OUT' })
    expect(focused()).toBe('src')
    send({ type: 'OUT' })
    expect(labels()).not.toContain('app')
    expect(opened).toEqual([['src'], []])
  })

  it('Up and Down walk the visible rows and pass over a disabled one; Home and End go to the ends', () => {
    const { send, focused } = tree({ defaultExpanded: ['src'] })
    send({ type: 'EDGE', edge: 'last' })
    expect(focused()).toBe('readme')
    send({ type: 'MOVE', step: -1 })
    send({ type: 'MOVE', step: -1 })
    expect(focused()).toBe('src/index.ts')
    send({ type: 'MOVE', step: 1 })
    expect(focused()).toBe('tests')
    send({ type: 'EDGE', edge: 'first' })
    expect(focused()).toBe('src')
    send({ type: 'MOVE', step: -1 })
    expect(focused()).toBe('src')
  })

  it('a branch closed from its chevron takes the focus from inside it up to itself', () => {
    const { send, focused, machine } = tree({ defaultExpanded: ['src', 'src/app'] })
    send({ type: 'FOCUS', value: 'src/app/routes.ts' })
    const nonce = machine.getState().focus.nonce
    send({ type: 'TOGGLE_EXPANDED', value: 'src' })
    expect(focused()).toBe('src')
    expect(machine.getState().focus.nonce).toBe(nonce + 1)
  })

  it('* opens every sibling; typing jumps to a label', () => {
    const { send, focused, labels } = tree()
    send({ type: 'EXPAND_SIBLINGS' })
    expect(labels()).toEqual(expect.arrayContaining(['app', 'app.test.ts']))
    expect(labels()).not.toContain('key')
    send({ type: 'TYPE', char: 'r', now: 1000 })
    expect(focused()).toBe('readme')
  })

  it('single choice replaces; multiple adds and takes back; none only opens', () => {
    const single = tree()
    single.send({ type: 'SELECT', value: 'readme' })
    single.send({ type: 'SELECT', value: 'readme' })
    single.send({ type: 'SELECT', value: 'tests' })
    expect(single.changes).toEqual([['readme'], ['tests']])
    // A press on a branch's row opens it, and a second closes it, choosing it all the while.
    expect(single.opened).toEqual([['tests']])
    single.send({ type: 'SELECT', value: 'tests' })
    expect(single.opened).toEqual([['tests'], []])
    expect(single.changes).toEqual([['readme'], ['tests']])

    const multiple = tree({ selectionMode: 'multiple' })
    multiple.send({ type: 'SELECT', value: 'readme' })
    multiple.send({ type: 'SELECT', value: 'tests' })
    multiple.send({ type: 'SELECT', value: 'readme' })
    expect(multiple.changes).toEqual([['readme'], ['readme', 'tests'], ['tests']])
    expect(multiple.opened).toEqual([])

    const none = tree({ selectionMode: 'none' })
    none.send({ type: 'SELECT', value: 'src' })
    none.send({ type: 'SELECT', value: 'readme' })
    expect(none.changes).toEqual([])
    expect(none.opened).toEqual([['src']])
  })

  it('a disabled node is neither opened nor chosen', () => {
    const { send, changes, opened } = tree()
    send({ type: 'TOGGLE_EXPANDED', value: 'secrets' })
    send({ type: 'SELECT', value: 'secrets' })
    expect(changes).toEqual([])
    expect(opened).toEqual([])
  })

  it('controlled: a choice is only asked for until the owner gives it', () => {
    const { machine, changes, opened } = tree({ value: [], expanded: [] })
    machine.send({ type: 'SELECT', value: 'readme' })
    machine.send({ type: 'TOGGLE_EXPANDED', value: 'src' })
    expect(changes).toEqual([['readme']])
    expect(opened).toEqual([['src']])
    expect(machine.getState().value).toEqual([])
    expect(machine.getState().expanded).toEqual([])
  })

  it('says its rows: level, place, open, chosen, one tab stop', () => {
    const { machine } = tree({ defaultExpanded: ['src'], defaultValue: ['src/index.ts'] })
    const api = connect(machine.getState(), machine.send, same, { label: 'Files' })
    expect(api.rootProps).toMatchObject({ role: 'tree', 'aria-label': 'Files' })
    const props = api.rows.map((row) => api.getItemProps(row) as Record<string, unknown>)
    expect(props[0]).toMatchObject({ role: 'treeitem', 'aria-level': 1, 'aria-expanded': 'true', tabIndex: -1 })
    expect(props.find((p) => p['data-value'] === 'src/index.ts')).toMatchObject({ 'aria-selected': 'true', tabIndex: 0, 'aria-level': 2, 'aria-posinset': 3, 'aria-setsize': 3 })
    expect(props.find((p) => p['data-value'] === 'readme')).toMatchObject({ 'aria-expanded': undefined, 'aria-selected': undefined })
    expect(props.filter((p) => p.tabIndex === 0)).toHaveLength(1)
  })
})
