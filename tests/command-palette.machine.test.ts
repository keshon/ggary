import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { attachPaletteSource, connect, createPaletteMachine, rankCommands, visibleGroups, type PaletteCommand } from '../packages/core/src/components/command-palette'
import { commands } from './conformance/commands'

/**
 * The palette with no DOM: what a query finds and in what order, the
 * highlight, levels opened and left, a command run after the palette has
 * closed, and a server's answer that is dropped when it comes too late.
 */

const same = (props: Record<string, unknown>) => props

const palette = (config: Partial<Parameters<typeof createPaletteMachine>[0]> = {}) => {
  const ran: string[] = []
  const opened: boolean[] = []
  const machine = createPaletteMachine({ id: 'p', commands, defaultOpen: true, onRun: (command) => ran.push(command.id), onOpenChange: (open) => opened.push(open), ...config })
  const labels = () => visibleGroups(machine.getState(), 'Results').map((group) => `${group.name}: ${group.commands.map((command) => command.label).join(', ')}`)
  return { machine, send: machine.send, ran, opened, labels, state: () => machine.getState() }
}

describe('command palette', () => {
  beforeEach(() => void vi.useFakeTimers())
  afterEach(() => void vi.useRealTimers())

  it('ranks a label that starts with the query, then a word of it, then a keyword, then anywhere', () => {
    const ids = (query: string) => rankCommands(commands, query).map((command) => command.id)
    expect(ids('re')).toEqual(['go-reports', 'go-settings'])
    expect(ids('card')).toEqual(['move'])
    expect(ids('sett')).toEqual(['go-settings'])
    expect(ids('notif')).toEqual(['go-settings'])
    expect(ids('')).toEqual(commands.map((command) => command.id))
  })

  it('gathers the matches under their headings, the heading of the best match first', () => {
    const { send, labels } = palette()
    expect(labels()).toEqual(['Actions: New deal, Move card, Export to CSV', 'Go to: Leads, Preferences, Reports'])
    send({ type: 'QUERY', text: 're' })
    expect(labels()).toEqual(['Go to: Reports, Preferences'])
    send({ type: 'QUERY', text: 'n' })
    expect(labels()[0]).toBe('Actions: New deal')
  })

  it('the highlight starts on the first, loops, and passes over a disabled command', () => {
    const { send, state } = palette()
    expect(state().highlighted).toBe('new-deal')
    send({ type: 'MOVE', step: 1 })
    send({ type: 'MOVE', step: 1 })
    expect(state().highlighted).toBe('go-leads')
    send({ type: 'EDGE', edge: 'last' })
    send({ type: 'MOVE', step: 1 })
    expect(state().highlighted).toBe('new-deal')
    send({ type: 'MOVE', step: -1 })
    expect(state().highlighted).toBe('go-reports')
  })

  it('a command with children opens its level; Backspace and Escape go back up onto it; Escape at the top closes', () => {
    const { send, state, labels, opened } = palette()
    send({ type: 'CHOOSE', id: 'move' })
    expect(state().path).toEqual(['move'])
    expect(labels()).toEqual([': New, In talks, Won'])
    send({ type: 'QUERY', text: 'wo' })
    expect(state().highlighted).toBe('move:won')
    send({ type: 'BACK' })
    expect(state()).toMatchObject({ path: [], query: '', highlighted: 'move' })
    send({ type: 'CHOOSE' })
    send({ type: 'ESCAPE' })
    expect(state().path).toEqual([])
    expect(state().open).toBe(true)
    send({ type: 'ESCAPE' })
    expect(state().open).toBe(false)
    expect(opened).toEqual([false])
  })

  it('a chosen command closes the palette and runs after it has', () => {
    const run = vi.fn()
    const { send, state, ran } = palette({ commands: [{ id: 'a', label: 'Archive', run }] })
    send({ type: 'CHOOSE' })
    expect(state().open).toBe(false)
    expect(run).not.toHaveBeenCalled()
    vi.runAllTimers()
    expect(run).toHaveBeenCalledOnce()
    expect(ran).toEqual(['a'])
  })

  it('a disabled command is not run; every opening starts afresh', () => {
    const { send, state, ran } = palette()
    send({ type: 'CHOOSE', id: 'export' })
    expect(state().open).toBe(true)
    send({ type: 'QUERY', text: 'lea' })
    send({ type: 'CHOOSE', id: 'move' })
    send({ type: 'CLOSE' })
    send({ type: 'OPEN' })
    expect(state()).toMatchObject({ query: '', path: [], highlighted: 'new-deal' })
    vi.runAllTimers()
    expect(ran).toEqual([])
  })

  it('a server’s answer stands under its own heading; a question no longer asked is dropped', async () => {
    const answers: ((items: PaletteCommand[]) => void)[] = []
    const { machine, send, labels, state } = palette()
    const detach = attachPaletteSource(machine, (query) => new Promise((resolve) => answers.push((items) => resolve(items.map((item) => ({ ...item, label: `${item.label} (${query})` }))))))
    send({ type: 'QUERY', text: 'ka' })
    await vi.advanceTimersByTimeAsync(150)
    send({ type: 'QUERY', text: 'kaz' })
    await vi.advanceTimersByTimeAsync(150)
    expect(answers).toHaveLength(2)
    answers[0]([{ id: 'late', label: 'Late' }])
    answers[1]([{ id: 'lead:1', label: 'Kazan Metro', group: 'ignored' }])
    await vi.runAllTimersAsync()
    expect(labels()).toEqual(['Results: Kazan Metro (kaz)'])
    expect(state().highlighted).toBe('lead:1')
    detach()
  })

  it('says what it is: a dialog with a combobox that names the highlighted option', () => {
    const { machine, send } = palette()
    const api = connect(machine.getState(), send, same)
    expect(api.contentProps).toMatchObject({ 'aria-label': 'Command palette' })
    expect(api.inputProps).toMatchObject({ role: 'combobox', 'aria-expanded': 'true', 'aria-controls': api.ids.list, 'aria-activedescendant': api.ids.item('new-deal') })
    expect(api.listProps).toMatchObject({ role: 'listbox' })
    expect(api.getItemProps(commands[2])).toMatchObject({ role: 'option', 'aria-disabled': 'true', 'aria-selected': 'false' })
    expect(api.status).toBe('6 results')
    send({ type: 'CHOOSE', id: 'move' })
    const inside = connect(machine.getState(), send, same)
    expect(inside.inputProps).toMatchObject({ placeholder: 'Move to which column?', 'aria-label': 'Command palette: Move card' })
    expect(inside.pages.map((page) => page.label)).toEqual(['Move card'])
  })
})
