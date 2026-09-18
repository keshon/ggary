import type { IconName } from '@ggary/icons'
import { createMachine, withEffects, type Machine } from '../../machine'
import { createAnatomy, type Dict, type Normalizer } from '../../types'
import { fold } from '../data-grid/data-grid.query'

/**
 * A command palette: Ctrl+K (⌘K) from anywhere, a field that finds what to do
 * — an action, a place, a record — and Enter does it.
 *
 * It is a modal dialog holding the APG's editable combobox with a list that is
 * always shown: the focus stays in the field, the arrows move a highlight
 * that `aria-activedescendant` names, and Enter runs it. A command with
 * `children` opens a level of its own (Move card › a column); Backspace in an
 * empty field or Escape goes back up, and Escape at the top closes.
 */

export interface PaletteCommand {
  id: string
  label: string
  /** The heading it stands under. Commands without one stand under none. */
  group?: string
  /** Words that find it besides its label: "settings" finds Preferences. */
  keywords?: string[]
  /** A quieter line under the label. It is searched too. */
  description?: string
  /** Shown at the end, for learning: "Ctrl+Shift+P", "G then L". Text only. */
  shortcut?: string
  disabled?: boolean
  /** A level of its own: choosing it shows these instead of running. */
  children?: PaletteCommand[]
  /** The field's placeholder on this command's level. */
  placeholder?: string
  /** Run when chosen, after the palette has closed. `onRun` hears it too. */
  run?: () => void
}

export type PaletteLoad = (query: string, signal: AbortSignal) => Promise<PaletteCommand[]>

export interface PaletteState {
  id: string
  open: boolean
  controlled: boolean
  commands: PaletteCommand[]
  query: string
  /** The levels opened, top first: the ids of the commands with children. */
  path: string[]
  highlighted: string | null
  /** A server's answer for `query` on the top level. */
  remote: { request: number; query: string; items: PaletteCommand[]; status: 'idle' | 'loading' | 'error' }
  openIntent: { value: boolean; nonce: number }
  runIntent: { value: PaletteCommand | null; nonce: number }
}

export type PaletteEvent =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'TOGGLE' }
  | { type: 'QUERY'; text: string }
  | { type: 'MOVE'; step: number }
  | { type: 'EDGE'; edge: 'first' | 'last' }
  | { type: 'HIGHLIGHT'; id: string }
  | { type: 'CHOOSE'; id?: string }
  /** Up a level; at the top, nothing. */
  | { type: 'BACK' }
  /** Escape: up a level, or closed at the top. */
  | { type: 'ESCAPE' }
  | { type: 'LOADING'; request: number }
  | { type: 'RESULTS'; request: number; query: string; items: PaletteCommand[] }
  | { type: 'FAILED'; request: number }
  | { type: 'SYNC_COMMANDS'; commands: PaletteCommand[] }
  | { type: 'SYNC_OPEN'; open: boolean }

export const paletteAnatomy = createAnatomy('command-palette', [
  'content',
  'control',
  'search-icon',
  'page',
  'input',
  'list',
  'group',
  'group-label',
  'item',
  'item-text',
  'item-description',
  'item-shortcut',
  'item-branch',
  'empty',
  'status',
  'footer',
  'hint',
  'key',
] as const)
export type PalettePart = (typeof paletteAnatomy.parts)[number]

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

export interface PaletteGroup {
  /** The heading; empty for commands without a group. */
  name: string
  commands: PaletteCommand[]
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

/**
 * Records from a server, on the top level: asked when the palette is open and
 * the typing pauses; a new question aborts the one in flight, and an answer
 * to a question no longer asked is dropped. Returns the cleanup.
 */
export function attachPaletteSource(machine: Machine<PaletteState, PaletteEvent>, load: PaletteLoad, { debounce = 150, minLength = 2 }: { debounce?: number; minLength?: number } = {}): () => void {
  let request = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let inFlight: AbortController | null = null
  let asked: string | null = null

  const ask = (query: string) => {
    inFlight?.abort()
    asked = query
    const id = ++request
    if (query.trim().length < minLength) {
      inFlight = null
      machine.send({ type: 'LOADING', request: id })
      machine.send({ type: 'RESULTS', request: id, query, items: [] })
      return
    }
    const controller = new AbortController()
    inFlight = controller
    machine.send({ type: 'LOADING', request: id })
    Promise.resolve()
      .then(() => load(query, controller.signal))
      .then(
        (items) => {
          if (!controller.signal.aborted) machine.send({ type: 'RESULTS', request: id, query, items })
        },
        (error) => {
          if (!controller.signal.aborted && !(error instanceof Error && error.name === 'AbortError')) machine.send({ type: 'FAILED', request: id })
        }
      )
  }

  const unsubscribe = machine.subscribe((state) => {
    if (!state.open || state.path.length > 0) {
      clearTimeout(timer)
      return
    }
    if (state.query === asked) return
    clearTimeout(timer)
    const query = state.query
    timer = setTimeout(() => ask(query), debounce)
  })
  return () => {
    unsubscribe()
    clearTimeout(timer)
    inFlight?.abort()
  }
}

/**
 * Ctrl+K, and ⌘K on a Mac, opens the palette from anywhere in the page — and
 * closes it when it is open. Returns the cleanup.
 */
export function attachPaletteHotkey(doc: Document, toggle: () => void, key = 'k'): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.altKey || event.shiftKey || event.key.toLowerCase() !== key) return
    const mac = /Mac|iPhone|iPad/.test(doc.defaultView?.navigator.platform ?? '')
    if (mac ? !event.metaKey : !event.ctrlKey) return
    event.preventDefault()
    toggle()
  }
  doc.addEventListener('keydown', onKeyDown)
  return () => doc.removeEventListener('keydown', onKeyDown)
}

export interface PaletteWords {
  /** The dialog's name. */
  label: string
  placeholder: string
  /** The results a server gave, under this heading. */
  results: string
  empty: string
  loading: string
  failed: string
  /** The live count. */
  count: (count: number) => string
  /** The footer's hints. */
  hintMove: string
  hintRun: string
  hintBack: string
  hintClose: string
}

export const PALETTE_WORDS: PaletteWords = {
  label: 'Command palette',
  placeholder: 'Type a command or search…',
  results: 'Results',
  empty: 'Nothing matches',
  loading: 'Searching…',
  failed: 'The search failed',
  count: (count) => (count === 1 ? '1 result' : `${count} results`),
  hintMove: 'to move',
  hintRun: 'to run',
  hintBack: 'to go back',
  hintClose: 'to close',
}

const idPart = (value: string) => value.replace(/[^\w-]/g, (char) => `_${char.charCodeAt(0).toString(16)}`)

export const paletteIds = (id: string) => ({
  content: `${id}-content`,
  input: `${id}-input`,
  list: `${id}-list`,
  status: `${id}-status`,
  group: (index: number) => `${id}-group-${index}`,
  item: (command: string) => `${id}-item-${idPart(command)}`,
})

export function connect<T = Dict>(state: PaletteState, send: (event: PaletteEvent) => void, normalize: Normalizer<T>, words: Partial<PaletteWords> = {}) {
  const w = { ...PALETTE_WORDS, ...words }
  const ids = paletteIds(state.id)
  const groups = visibleGroups(state, w.results)
  const count = groups.reduce((sum, group) => sum + group.commands.length, 0)
  const pages = state.path.map((id, i) => levelOf(state.commands, state.path.slice(0, i)).find((command) => command.id === id)).filter((command): command is PaletteCommand => !!command)
  const page = pages[pages.length - 1]
  const loading = state.path.length === 0 && state.remote.status === 'loading'
  const failed = state.path.length === 0 && state.remote.status === 'error'
  const status = loading && count === 0 ? w.loading : failed && count === 0 ? w.failed : count === 0 ? w.empty : w.count(count)

  return {
    ids,
    words: w,
    open: state.open,
    groups,
    pages,
    query: state.query,
    highlighted: state.highlighted,
    status,
    loading,
    isEmpty: count === 0,
    show: () => send({ type: 'OPEN' }),
    close: () => send({ type: 'CLOSE' }),
    toggle: () => send({ type: 'TOGGLE' }),

    /** An opener of your own: a button in a toolbar that says its shortcut. Spread onto a Button; no data-scope of the palette's. */
    triggerProps: normalize({
      type: 'button',
      'aria-haspopup': 'dialog',
      'aria-expanded': state.open ? 'true' : 'false',
      'aria-controls': ids.content,
      'aria-keyshortcuts': 'Control+K Meta+K',
      onClick: () => send({ type: 'TOGGLE' }),
    }),

    contentProps: normalize({
      ...paletteAnatomy.attrs('content'),
      id: ids.content,
      'aria-label': w.label,
      tabIndex: -1,
      'data-state': state.open ? 'open' : 'closed',
    }),
    controlProps: normalize({ ...paletteAnatomy.attrs('control') }),
    searchIconProps: normalize({ ...paletteAnatomy.attrs('search-icon'), 'aria-hidden': 'true', 'data-icon': 'search' satisfies IconName }),
    pageProps: normalize({ ...paletteAnatomy.attrs('page') }),
    inputProps: normalize({
      ...paletteAnatomy.attrs('input'),
      id: ids.input,
      type: 'text',
      role: 'combobox',
      autoComplete: 'off',
      spellCheck: false,
      'aria-expanded': 'true',
      'aria-controls': ids.list,
      'aria-autocomplete': 'list',
      'aria-activedescendant': state.highlighted ? ids.item(state.highlighted) : undefined,
      'aria-describedby': ids.status,
      'aria-label': page ? `${w.label}: ${pages.map((command) => command.label).join(' › ')}` : w.label,
      placeholder: page?.placeholder ?? w.placeholder,
      value: state.query,
      onInput: (event: Event) => send({ type: 'QUERY', text: (event.target as HTMLInputElement).value }),
      onKeyDown: (event: KeyboardEvent) => {
        if (event.isComposing) return
        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault()
            send({ type: 'MOVE', step: 1 })
            return
          case 'ArrowUp':
            event.preventDefault()
            send({ type: 'MOVE', step: -1 })
            return
          case 'PageDown':
            event.preventDefault()
            send({ type: 'EDGE', edge: 'last' })
            return
          case 'PageUp':
            event.preventDefault()
            send({ type: 'EDGE', edge: 'first' })
            return
          case 'Enter':
            event.preventDefault()
            send({ type: 'CHOOSE' })
            return
          case 'Backspace': {
            const input = event.target as HTMLInputElement
            if (input.value === '' && state.path.length > 0) {
              event.preventDefault()
              send({ type: 'BACK' })
            }
            return
          }
        }
      },
    }),
    listProps: normalize({ ...paletteAnatomy.attrs('list'), id: ids.list, role: 'listbox', 'aria-label': page?.label ?? w.label }),
    getGroupProps: (group: PaletteGroup, index: number) =>
      normalize({ ...paletteAnatomy.attrs('group'), role: 'group', 'aria-labelledby': group.name ? ids.group(index) : undefined }),
    getGroupLabelProps: (_group: PaletteGroup, index: number) => normalize({ ...paletteAnatomy.attrs('group-label'), id: ids.group(index), role: 'presentation' }),
    getItemProps: (command: PaletteCommand) => {
      const highlighted = command.id === state.highlighted
      return normalize({
        ...paletteAnatomy.attrs('item'),
        id: ids.item(command.id),
        role: 'option',
        'aria-selected': highlighted ? 'true' : 'false',
        'aria-disabled': command.disabled ? 'true' : undefined,
        'data-highlighted': highlighted ? '' : undefined,
        'data-disabled': command.disabled ? '' : undefined,
        'data-branch': command.children ? '' : undefined,
        // The field keeps the focus: a press must not take it.
        onPointerDown: (event: PointerEvent) => event.preventDefault(),
        onPointerMove: () => {
          if (!highlighted && !command.disabled) send({ type: 'HIGHLIGHT', id: command.id })
        },
        onClick: () => send({ type: 'CHOOSE', id: command.id }),
      })
    },
    itemTextProps: normalize({ ...paletteAnatomy.attrs('item-text') }),
    itemDescriptionProps: normalize({ ...paletteAnatomy.attrs('item-description') }),
    itemShortcutProps: normalize({ ...paletteAnatomy.attrs('item-shortcut'), 'aria-hidden': 'true' }),
    itemBranchProps: normalize({ ...paletteAnatomy.attrs('item-branch'), 'aria-hidden': 'true', 'data-icon': 'chevron-right' satisfies IconName }),
    emptyProps: normalize({ ...paletteAnatomy.attrs('empty') }),
    statusProps: normalize({ ...paletteAnatomy.attrs('status'), id: ids.status, role: 'status', 'aria-live': 'polite' }),
    footerProps: normalize({ ...paletteAnatomy.attrs('footer'), 'aria-hidden': 'true' }),
    hintProps: normalize({ ...paletteAnatomy.attrs('hint') }),
    keyProps: normalize({ ...paletteAnatomy.attrs('key') }),
  }
}

export type PaletteApi<T = Dict> = ReturnType<typeof connect<T>>

/** Keep the highlighted command in view as the arrows move it. */
export function revealPaletteItem(list: HTMLElement | null, id: string | null): void {
  if (!list || !id) return
  const item = list.ownerDocument.getElementById(id)
  if (!item || !list.contains(item)) return
  const top = item.offsetTop
  const bottom = top + item.offsetHeight
  if (top < list.scrollTop) list.scrollTop = top
  else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight
}
