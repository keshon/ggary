import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { connect as connectShell, createShellMachine, SHELL_NARROW } from '../packages/core/src/components/shell'
import { connect as connectSplit, createSplitMachine } from '../packages/core/src/components/split'
import { connect as connectRail } from '../packages/core/src/components/rail'

/**
 * The frame of an application, with no DOM: the drawer's open state and what
 * it says, the split's size inside its bounds and the fold, the rail's groups.
 */

const same = (props: Record<string, unknown>) => props

describe('the shell', () => {
  it('opens and closes the drawer, and says so on the toggle', () => {
    const changes: [boolean, string][] = []
    const machine = createShellMachine({ id: 's', onOpenChange: (open, { reason }) => changes.push([open, reason]) })
    let api = connectShell(machine.getState(), machine.send, same)
    expect(api.toggleProps['aria-expanded']).toBe('false')
    expect(api.toggleProps['aria-controls']).toBe('s-aside')
    expect(api.mainProps).toMatchObject({ id: 's-main', tabIndex: -1 })
    expect(api.skipLinkProps.href).toBe('#s-main')

    ;(api.toggleProps.onClick as () => void)()
    api = connectShell(machine.getState(), machine.send, same)
    expect(api.open).toBe(true)
    expect(api.toggleProps['aria-expanded']).toBe('true')
    expect(api.rootProps['data-state']).toBe('open')
    api.close('escape')
    expect(changes).toEqual([
      [true, 'toggle'],
      [false, 'escape'],
    ])
  })

  it('a link followed from the open drawer closes it; a press elsewhere in it does not', () => {
    const machine = createShellMachine({ id: 's', defaultOpen: true })
    const press = (target: unknown) =>
      (connectShell(machine.getState(), machine.send, same).asideProps.onClick as (e: unknown) => void)({ target })
    press({ closest: () => null })
    expect(machine.getState().open).toBe(true)
    press({ closest: (selector: string) => (selector === 'a[href]' ? {} : null) })
    expect(machine.getState().open).toBe(false)
  })

  it('a bar has no drawer: no toggle, and never open', () => {
    const machine = createShellMachine({ id: 's', collapse: 'bar', defaultOpen: true })
    const api = connectShell(machine.getState(), machine.send, same)
    expect(api.open).toBe(false)
    expect(api.toggleProps.hidden).toBe(true)
    machine.send({ type: 'SYNC_OPTIONS', collapse: 'drawer' })
    machine.send({ type: 'SYNC_OPTIONS', collapse: 'bar' })
    expect(machine.getState().open).toBe(false)
  })
})

describe('the split', () => {
  const split = (config: Parameters<typeof createSplitMachine>[0] = { id: 'x' }) => {
    const sizes: [number, boolean][] = []
    const machine = createSplitMachine({ onSizeChange: (size, { collapsed }) => sizes.push([size, collapsed]), ...config })
    return { machine, sizes, api: () => connectSplit(machine.getState(), machine.send, same, { label: 'Resize the list' }) }
  }

  it('is a separator with a value: the primary pane’s size, between its bounds', () => {
    const { api } = split({ id: 'x', min: 200, max: 500, defaultSize: 300 })
    expect(api().separatorProps).toMatchObject({
      role: 'separator',
      tabIndex: 0,
      'aria-label': 'Resize the list',
      'aria-orientation': 'vertical',
      'aria-controls': 'x-start',
      'aria-valuenow': 300,
      'aria-valuemin': 200,
      'aria-valuemax': 500,
    })
    expect(api().rootProps.style).toMatchObject({ '--gg-split-size': '300px' })
  })

  it('steps and stays within its bounds, and within what the frame leaves', () => {
    const { machine, sizes } = split({ id: 'x', min: 200, max: 500, defaultSize: 300, step: 20 })
    machine.send({ type: 'STEP', delta: 20 })
    expect(machine.getState().size).toBe(320)
    machine.send({ type: 'TO_MAX' })
    expect(machine.getState().size).toBe(500)
    // A frame 600 wide, with 200 kept for the other pane and 8 for the separator.
    machine.send({ type: 'STEP', delta: 20, limit: 392 })
    expect(machine.getState().size).toBe(392)
    machine.send({ type: 'SET_SIZE', size: 10 })
    expect(machine.getState().size).toBe(200)
    machine.send({ type: 'RESET' })
    expect(machine.getState().size).toBe(300)
    expect(sizes.at(-1)).toEqual([300, false])
  })

  it('a collapsible pane folds on Enter and on a drag well past its minimum, and comes back', () => {
    const { machine, api } = split({ id: 'x', min: 200, collapsible: true, defaultSize: 300 })
    machine.send({ type: 'TOGGLE_COLLAPSE' })
    expect(api().startPaneProps.hidden).toBe(true)
    expect(api().separatorProps['aria-valuenow']).toBe(0)
    expect(api().separatorProps['aria-valuemin']).toBe(0)
    // Growing a folded pane unfolds it at the size it had.
    machine.send({ type: 'STEP', delta: 16 })
    expect(machine.getState()).toMatchObject({ collapsed: false, size: 300 })
    machine.send({ type: 'SET_SIZE', size: 150, reason: 'pointer' })
    expect(machine.getState()).toMatchObject({ collapsed: false, size: 200 })
    machine.send({ type: 'SET_SIZE', size: 60, reason: 'pointer' })
    expect(machine.getState().collapsed).toBe(true)
  })

  it('a pane that cannot fold does not', () => {
    const { machine } = split({ id: 'x', min: 200 })
    machine.send({ type: 'TOGGLE_COLLAPSE' })
    machine.send({ type: 'SET_SIZE', size: 10, reason: 'pointer' })
    expect(machine.getState()).toMatchObject({ collapsed: false, size: 200 })
  })

  it('the end pane can be the one with the size; a vertical split is parted by a horizontal line', () => {
    const { api } = split({ id: 'x', primary: 'end', orientation: 'vertical' })
    expect(api().separatorProps['aria-controls']).toBe('x-end')
    expect(api().separatorProps['aria-orientation']).toBe('horizontal')
    expect(api().endPaneProps['data-primary']).toBe('')
  })
})

describe('the rail', () => {
  it('puts the items marked end at the bottom and marks the current one', () => {
    const api = connectRail(
      {
        id: 'r',
        label: 'Sections',
        items: [
          { label: 'Leads', href: '/leads', icon: 'list', current: true, count: 3 },
          { label: 'Reports', href: '/reports', icon: 'chart' },
          { label: 'Settings', href: '/settings', icon: 'settings', end: true },
        ],
      },
      same
    )
    expect(api.start.map((item) => item.label)).toEqual(['Leads', 'Reports'])
    expect(api.end.map((item) => item.label)).toEqual(['Settings'])
    expect(api.getItemProps(api.start[0]).itemProps['aria-current']).toBe('page')
    expect(api.getItemProps(api.start[0]).showCount).toBe(true)
    expect(api.rootProps['aria-label']).toBe('Sections')
  })
})

describe('the breakpoint', () => {
  it('is one number: core’s query and the structure layer’s @media agree', () => {
    const css = readFileSync(new URL('../packages/structure/src/layout.css', import.meta.url), 'utf-8')
    const queries = [...css.matchAll(/@media\s*(\([^)]*\))/g)].map((match) => match[1])
    expect(queries).toEqual([SHELL_NARROW])
  })
})
