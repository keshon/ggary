import { createMachine, withEffects, type Machine } from '../../machine'
import { fold } from '../data-grid/data-grid.query'
import type { PaletteCommand, PaletteEvent, PaletteGroup, PaletteState } from './command-palette.types'

/** The commands of the level the path has opened. */
export function levelOf(commands: PaletteCommand[], path: string[]): PaletteCommand[] {
  let level = commands
  for (const id of path) level = level.find((command) => command.id === id)?.children ?? []
  return level
}

/**
 * The commands that match a query, the best first: a label that starts with
 * it, then a word of the label, then a keyword, then anywhere in the label or
 * its description. Case and accents do not count, and "е" finds "ё".
 */
export function rankCommands(commands: PaletteCommand[], query: string): PaletteCommand[] {
  const needle = fold(query.trim())
  if (!needle) return commands
  const ranked: { command: PaletteCommand; rank: number }[] = []
  for (const command of commands) {
    const label = fold(command.label)
    let rank = -1
    if (label.startsWith(needle)) rank = 0
    else if (label.split(/[\s\-_.,/()›:]+/).some((word) => word.startsWith(needle))) rank = 1
    else if (command.keywords?.some((keyword) => fold(keyword).startsWith(needle))) rank = 2
    else if (label.includes(needle) || (command.description !== undefined && fold(command.description).includes(needle))) rank = 3
    if (rank >= 0) ranked.push({ command, rank })
  }
  ranked.sort((a, b) => a.rank - b.rank)
  return ranked.map((entry) => entry.command)
}

/**
 * What the list shows: the level's commands that match, gathered under their
 * headings — a heading where its best match falls, so the best match of all
 * is first — and, on the top level, the server's answer under its own.
 */
export function visibleGroups(state: PaletteState, resultsLabel: string): PaletteGroup[] {
  const ranked = rankCommands(levelOf(state.commands, state.path), state.query)
  const groups: PaletteGroup[] = []
  for (const command of ranked) {
    const name = command.group ?? ''
    const group = groups.find((candidate) => candidate.name === name)
    if (group) group.commands.push(command)
    else groups.push({ name, commands: [command] })
  }
  if (state.path.length === 0 && state.remote.query === state.query && state.remote.items.length > 0) {
    groups.push({ name: resultsLabel, commands: state.remote.items })
  }
  return groups
}

const flat = (state: PaletteState) => visibleGroups(state, '').flatMap((group) => group.commands)
const enabled = (command: PaletteCommand) => !command.disabled
const firstEnabled = (state: PaletteState) => flat(state).find(enabled)?.id ?? null

/** After the list changed: the highlight stays on its command if it is still shown, else the first. */
function rehighlight(state: PaletteState, keep = true): PaletteState {
  const list = flat(state)
  const still = keep && state.highlighted !== null && list.some((command) => command.id === state.highlighted && enabled(command))
  return { ...state, highlighted: still ? state.highlighted : (list.find(enabled)?.id ?? null) }
}

function setOpen(state: PaletteState, open: boolean): PaletteState {
  if (state.open === open) return state
  const intent = { value: open, nonce: state.openIntent.nonce + 1 }
  // Every opening starts afresh: the top level, an empty field.
  const fresh = open ? rehighlight({ ...state, query: '', path: [], highlighted: null }, false) : state
  return state.controlled ? { ...state, openIntent: intent } : { ...fresh, open, openIntent: intent }
}

export function reducer(state: PaletteState, event: PaletteEvent): PaletteState {
  switch (event.type) {
    case 'OPEN':
      return setOpen(state, true)
    case 'CLOSE':
      return setOpen(state, false)
    case 'TOGGLE':
      return setOpen(state, !state.open)

    case 'QUERY':
      return event.text === state.query ? state : rehighlight({ ...state, query: event.text }, false)

    case 'MOVE': {
      const list = flat(state).filter(enabled)
      if (list.length === 0) return state
      const at = list.findIndex((command) => command.id === state.highlighted)
      // The list loops: past the last is the first.
      const next = at === -1 ? (event.step > 0 ? 0 : list.length - 1) : (at + event.step + list.length) % list.length
      return { ...state, highlighted: list[next].id }
    }

    case 'EDGE': {
      const list = flat(state).filter(enabled)
      const target = event.edge === 'first' ? list[0] : list[list.length - 1]
      return target ? { ...state, highlighted: target.id } : state
    }

    case 'HIGHLIGHT': {
      const command = flat(state).find((candidate) => candidate.id === event.id)
      return command && enabled(command) && state.highlighted !== event.id ? { ...state, highlighted: event.id } : state
    }

    case 'CHOOSE': {
      const id = event.id ?? state.highlighted
      const command = flat(state).find((candidate) => candidate.id === id)
      if (!command || !enabled(command)) return state
      if (command.children) return rehighlight({ ...state, path: [...state.path, command.id], query: '', highlighted: null }, false)
      const run = { value: command, nonce: state.runIntent.nonce + 1 }
      return setOpen({ ...state, runIntent: run }, false)
    }

    case 'BACK': {
      if (state.path.length === 0) return state
      const up = state.path[state.path.length - 1]
      // Back on the level above, on the command that opened this one.
      return { ...state, path: state.path.slice(0, -1), query: '', highlighted: up }
    }

    case 'ESCAPE':
      return state.path.length > 0 ? reducer(state, { type: 'BACK' }) : setOpen(state, false)

    case 'LOADING':
      return { ...state, remote: { ...state.remote, request: event.request, status: 'loading' } }
    case 'RESULTS':
      if (event.request !== state.remote.request) return state
      return rehighlight({ ...state, remote: { request: event.request, query: event.query, items: event.items, status: 'idle' } })
    case 'FAILED':
      return event.request !== state.remote.request ? state : { ...state, remote: { ...state.remote, status: 'error' } }

    case 'SYNC_COMMANDS':
      return event.commands === state.commands ? state : rehighlight({ ...state, commands: event.commands })
    case 'SYNC_OPEN': {
      if (event.open === state.open) return state
      return event.open ? rehighlight({ ...state, open: true, query: '', path: [], highlighted: null }, false) : { ...state, open: false }
    }
  }
}

export interface PaletteConfig {
  id: string
  commands: PaletteCommand[]
  /** Controlled. Omit and use `defaultOpen` for uncontrolled. */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** A command was chosen. It runs after the palette has closed and given the focus back. */
  onRun?: (command: PaletteCommand) => void
}

export function initialState(config: PaletteConfig): PaletteState {
  const controlled = config.open !== undefined
  const open = (controlled ? config.open : config.defaultOpen) ?? false
  const state: PaletteState = {
    id: config.id,
    open,
    controlled,
    commands: config.commands,
    query: '',
    path: [],
    highlighted: null,
    remote: { request: 0, query: '', items: [], status: 'idle' },
    openIntent: { value: open, nonce: 0 },
    runIntent: { value: null, nonce: 0 },
  }
  return { ...state, highlighted: firstEnabled(state) }
}

export function createPaletteMachine(config: PaletteConfig): Machine<PaletteState, PaletteEvent> {
  const machine = createMachine(initialState(config), reducer)
  return withEffects(machine, (previous, next) => {
    if (next.openIntent.nonce !== previous.openIntent.nonce) config.onOpenChange?.(next.openIntent.value)
    if (next.runIntent.nonce !== previous.runIntent.nonce && next.runIntent.value) {
      const command = next.runIntent.value
      // After the palette has closed and handed the focus back: a command may open a dialog of its own.
      setTimeout(() => {
        command.run?.()
        config.onRun?.(command)
      }, 0)
    }
  })
}
