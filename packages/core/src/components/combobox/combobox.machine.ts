import { createMachine, withEffects, type Machine } from '../../machine'
import { edgeEnabled, nextEnabled } from '../../utils/collection'
import { syncOptions } from '../../utils/open-intent'
import { fold } from '../data-grid/data-grid.query'
import type { ComboboxEvent, ComboboxItem, ComboboxOptions, ComboboxState } from './combobox.types'

export const DEFAULTS: ComboboxOptions = { multiple: false, disabled: false, limit: 50, creatable: false }

const collection = { isDisabled: (item: ComboboxItem) => Boolean(item.disabled), loop: false }
const first = (items: ComboboxItem[]) => edgeEnabled(items, 'first', collection)

/**
 * The options that match a query, the best first: a label that starts with
 * what was typed, then one with a word that does, then one that contains it
 * anywhere — its description included. Case and accents do not count, and
 * "е" finds "ё". Only `limit` of them are kept; `total` says how many there were.
 */
export function filterItems(items: readonly ComboboxItem[], query: string, limit: number): { items: ComboboxItem[]; total: number } {
  const needle = fold(query.trim())
  if (!needle) return { items: items.slice(0, limit), total: items.length }
  const ranked: { item: ComboboxItem; rank: number }[] = []
  for (const item of items) {
    const label = fold(item.label)
    let rank = -1
    if (label.startsWith(needle)) rank = 0
    else if (label.split(/[\s\-_.,/()]+/).some((word) => word.startsWith(needle))) rank = 1
    else if (label.includes(needle) || (item.description !== undefined && fold(item.description).includes(needle))) rank = 2
    if (rank >= 0) ranked.push({ item, rank })
  }
  // A stable sort keeps the source's own order within a rank.
  ranked.sort((a, b) => a.rank - b.rank)
  return { items: ranked.slice(0, limit).map((entry) => entry.item), total: ranked.length }
}

/** The value of the "Create …" option: no option of anyone's has it. */
export const CREATE_VALUE = '\u0000create'

/**
 * The "Create …" option, at the end of the list, when what is typed matches
 * no option's label exactly — case and accents not counting. Highlighted
 * when it is all there is, so Enter creates.
 */
function withCreate(state: ComboboxState): ComboboxState {
  const items = state.items.filter((item) => !item.create)
  const text = state.query.trim()
  const offer = state.creatable && state.typing && text !== '' && !items.some((item) => fold(item.label) === fold(text))
  const next = offer ? [...items, { value: CREATE_VALUE, label: text, create: true as const }] : items
  if (next.length === state.items.length && next.every((item, i) => item === state.items[i])) return state
  // A highlight on the list stays; with nothing else to choose, the option to create is highlighted.
  const highlighted = state.highlightedIndex >= 0 && state.highlightedIndex < next.length ? state.highlightedIndex : offer && items.length === 0 ? 0 : -1
  return { ...state, items: next, highlightedIndex: highlighted }
}

/** The options for the current query, when the list is in the page. */
function refilter(state: ComboboxState, query: string): ComboboxState {
  if (!state.source) return state
  const { items, total } = filterItems(state.source, query, state.limit)
  return withCreate({ ...state, items, total, answered: query, highlightedIndex: query.trim() ? first(items) : -1 })
}

const known = (state: ComboboxState, value: string): ComboboxItem =>
  state.selected.find((item) => item.value === value) ??
  state.source?.find((item) => item.value === value) ??
  state.items.find((item) => item.value === value) ?? { value, label: value }

/** Every choice the person makes goes through here, as Select's does: intent always, value when owned. */
function commit(state: ComboboxState, value: string[], selected: ComboboxItem[]): ComboboxState {
  const next = { ...state, intent: { value, nonce: state.intent.nonce + 1 } }
  return state.controlled ? next : { ...next, value, selected }
}

/** Closed, and the field back to what was chosen: an unfinished search is not a value. */
function closed(state: ComboboxState): ComboboxState {
  const reverted = { ...state, open: false, typing: false, query: '', highlightedIndex: -1 }
  return state.source ? refilter(reverted, '') : reverted
}

export function reducer(state: ComboboxState, event: ComboboxEvent): ComboboxState {
  switch (event.type) {
    case 'OPEN': {
      if (state.open || state.disabled) return state
      // Opened on the chosen value, so the list shows where it stands.
      const selectedIndex = state.value.length === 1 && !state.multiple ? state.items.findIndex((item) => item.value === state.value[0]) : -1
      return { ...state, open: true, highlightedIndex: selectedIndex }
    }

    case 'CLOSE':
      return state.open || state.typing ? closed(state) : state

    case 'TOGGLE':
      return reducer(state, state.open ? { type: 'CLOSE' } : { type: 'OPEN' })

    case 'INPUT': {
      if (state.disabled) return state
      const next = { ...state, query: event.text, typing: true, open: true }
      // A server list keeps showing its last answer until the next one lands.
      return state.source ? refilter({ ...next, createError: null }, event.text) : withCreate({ ...next, createError: null, highlightedIndex: -1 })
    }

    case 'HIGHLIGHT': {
      if (event.index === state.highlightedIndex) return state
      if (event.index !== -1 && (!state.items[event.index] || state.items[event.index].disabled)) return state
      return { ...state, highlightedIndex: event.index }
    }

    case 'HIGHLIGHT_MOVE': {
      if (state.disabled) return state
      if (!state.open) return { ...reducer(state, { type: 'OPEN' }), highlightedIndex: event.step > 0 ? first(state.items) : edgeEnabled(state.items, 'last', collection) }
      const next = nextEnabled(state.items, state.highlightedIndex, event.step, collection)
      return next === state.highlightedIndex ? state : { ...state, highlightedIndex: next }
    }

    case 'HIGHLIGHT_EDGE': {
      if (!state.open) return state
      const next = edgeEnabled(state.items, event.edge, collection)
      return next === state.highlightedIndex ? state : { ...state, highlightedIndex: next }
    }

    case 'SELECT': {
      const index = event.index ?? state.highlightedIndex
      const item = state.items[index]
      if (!item || item.disabled) return state
      // "Create …": the owner is asked; the list stays open, saying so, until it answers.
      if (item.create) {
        if (state.creating !== null) return state
        return { ...state, creating: item.label, createError: null, createIntent: { value: item.label, nonce: state.createIntent.nonce + 1 } }
      }
      if (!state.multiple) {
        return closed({ ...commit(state, [item.value], [item]), highlightedIndex: index })
      }
      // Choosing a chosen one again takes it back, as a checkbox would.
      const has = state.value.includes(item.value)
      const value = has ? state.value.filter((entry) => entry !== item.value) : [...state.value, item.value]
      const selected = has ? state.selected.filter((entry) => entry.value !== item.value) : [...state.selected, item]
      // The list stays open for the next pick, and the query goes: it found this one.
      const next = { ...commit(state, value, selected), query: '', typing: false }
      return state.source ? { ...refilter(next, ''), highlightedIndex: index < next.items.length ? index : -1 } : { ...next, highlightedIndex: index }
    }

    case 'REMOVE': {
      if (!state.value.includes(event.value)) return state
      return commit(
        state,
        state.value.filter((entry) => entry !== event.value),
        state.selected.filter((entry) => entry.value !== event.value)
      )
    }

    case 'REMOVE_LAST': {
      if (!state.multiple || state.query !== '' || state.value.length === 0) return state
      return reducer(state, { type: 'REMOVE', value: state.value[state.value.length - 1] })
    }

    case 'CLEAR': {
      const cleared = { ...state, query: '', typing: false }
      if (state.value.length === 0) return state.query === '' ? state : state.source ? refilter(cleared, '') : cleared
      const next = commit(cleared, [], [])
      return state.source ? refilter(next, '') : next
    }

    case 'CREATED': {
      if (state.creating === null) return state
      const item = { ...event.item, create: undefined }
      const done = { ...state, creating: null, selected: [...state.selected.filter((entry) => entry.value !== item.value), item] }
      if (!state.multiple) return closed(commit(done, [item.value], [item]))
      const value = done.value.includes(item.value) ? done.value : [...done.value, item.value]
      const selected = done.selected.filter((entry) => value.includes(entry.value))
      const next = { ...commit(done, value, selected), query: '', typing: false }
      return state.source ? refilter(next, '') : withCreate(next)
    }

    case 'CREATE_FAILED':
      return state.creating === null ? state : { ...state, creating: null, createError: event.message }

    case 'LOADING':
      return { ...state, status: 'loading', request: event.request, error: null }

    case 'RESULTS': {
      if (event.request !== state.request) return state
      return withCreate({
        ...state,
        items: event.items,
        total: event.total ?? event.items.length,
        answered: event.query,
        status: 'idle',
        error: null,
        highlightedIndex: state.open && event.query.trim() ? first(event.items) : -1,
      })
    }

    case 'FAILED':
      if (event.request !== state.request) return state
      return { ...state, status: 'error', error: event.message }

    case 'SYNC_VALUE': {
      const value = event.value === null ? [] : Array.isArray(event.value) ? event.value : [event.value]
      const withItems = event.items ? { ...state, selected: [...event.items, ...state.selected] } : state
      if (value.length === state.value.length && value.every((entry, i) => entry === state.value[i]) && !event.items) return state
      return { ...withItems, value, selected: value.map((entry) => known(withItems, entry)) }
    }

    case 'SYNC_SOURCE': {
      if (event.items === state.source) return state
      return refilter({ ...state, source: event.items }, state.typing ? state.query : '')
    }

    case 'SYNC_OPTIONS': {
      const { type: _type, ...options } = event
      const next = syncOptions(state, DEFAULTS, options)
      if (next === state) return state
      const trimmed = !next.multiple && next.value.length > 1 ? { ...next, value: next.value.slice(0, 1), selected: next.selected.slice(0, 1) } : next
      return trimmed.disabled ? closed(trimmed) : trimmed.source ? refilter(trimmed, trimmed.query) : withCreate(trimmed)
    }
  }
}

export interface ComboboxConfig extends Partial<ComboboxOptions> {
  id: string
  /** The options, filtered in the page. Omit when a server answers (see attachComboboxSource). */
  items?: ComboboxItem[]
  /** Controlled; `defaultValue` for uncontrolled. A single combobox takes a string. */
  value?: string | string[] | null
  defaultValue?: string | string[] | null
  /** The chosen items, when their labels are not in `items` — values a server knows. */
  selectedItems?: ComboboxItem[]
  onValueChange?: (value: string[], items: ComboboxItem[]) => void
  onOpenChange?: (open: boolean) => void
  /**
   * Create an option for typed text that matches none: offered as "Create …"
   * at the end of the list. Return the option — or a promise of it — and it
   * is chosen; return nothing and the text is its own value. A rejection says
   * why, and chooses nothing. Add the option to `items` to keep it.
   */
  onCreate?: (text: string) => ComboboxItem | void | Promise<ComboboxItem | void>
}

const asList = (value: string | string[] | null | undefined) => (value == null ? [] : Array.isArray(value) ? value : [value])

export function initialState(config: ComboboxConfig): ComboboxState {
  const options: ComboboxOptions = {
    multiple: config.multiple ?? DEFAULTS.multiple,
    disabled: config.disabled ?? DEFAULTS.disabled,
    limit: config.limit ?? DEFAULTS.limit,
    creatable: config.creatable ?? config.onCreate !== undefined,
  }
  const controlled = config.value !== undefined
  const value = asList(controlled ? config.value : config.defaultValue)
  const base: ComboboxState = {
    id: config.id,
    ...options,
    open: false,
    query: '',
    typing: false,
    source: config.items ?? null,
    items: [],
    total: 0,
    highlightedIndex: -1,
    status: 'idle',
    answered: '',
    request: 0,
    error: null,
    value,
    selected: config.selectedItems ?? [],
    controlled,
    intent: { value, nonce: 0 },
    creating: null,
    createError: null,
    createIntent: { value: null, nonce: 0 },
  }
  const filtered = base.source ? refilter(base, '') : base
  return { ...filtered, selected: value.map((entry) => known(filtered, entry)) }
}

export function createComboboxMachine(config: ComboboxConfig): Machine<ComboboxState, ComboboxEvent> {
  const machine = createMachine(initialState(config), reducer)
  // Answers are sent to the machine with its effects, so what they change is heard too.
  const wrapped: Machine<ComboboxState, ComboboxEvent> = withEffects(machine, (previous, next) => {
    if (previous.open !== next.open) config.onOpenChange?.(next.open)
    if (previous.createIntent.nonce !== next.createIntent.nonce && next.createIntent.value !== null) {
      const text = next.createIntent.value
      Promise.resolve()
        .then(() => config.onCreate?.(text))
        .then(
          (item) => wrapped.send({ type: 'CREATED', item: item ?? { value: text, label: text } }),
          (error) => wrapped.send({ type: 'CREATE_FAILED', message: error instanceof Error ? error.message : String(error) })
        )
    }
    if (previous.intent.nonce !== next.intent.nonce) {
      const items = next.intent.value.map((value) => known(next, value))
      config.onValueChange?.(next.intent.value, items)
    }
  })
  return wrapped
}
