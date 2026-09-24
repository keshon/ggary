import { createMachine, withEffects, type Machine } from '../../machine'
import { createAnatomy, type Dict, type Normalizer } from '../../types'
import type { IconName } from '@ggary/icons'
import type { MenuEntry } from '../menu'
import { flipKanban } from './drag'

export { attachKanbanDrag, flipKanban, type KanbanDragOptions } from './drag'

/**
 * A kanban board: columns of cards, a card moved from one place to another.
 *
 * There is no APG pattern for it; this follows what the accessible boards
 * that exist agree on. The board is one tab stop, on a card. The arrows walk
 * the cards; Space picks the focused one up, and then the arrows move it —
 * up and down its column, across into the next — while a live region says
 * where it is; Space or Enter drops it, Escape puts it back where it was.
 * Enter on a card that is not picked up opens it.
 *
 * A move is shown at once and handed to `onMove`. A rejection puts that card
 * back — that card only — and says why; an answer to a move since overtaken
 * by another of the same card says nothing. The DataGrid's cell saves work
 * the same way.
 */

export interface KanbanColumn {
  id: string
  title: string
  /** A work-in-progress limit: shown beside the count, and marked when passed. Soft: a move past it is not refused. */
  limit?: number
}

export interface KanbanCard {
  id: string
  /** The column it stands in. Within a column, cards stand in the order they are given. */
  column: string
  title: string
}

export interface KanbanPlace {
  column: string
  /** Among the column's cards once the card has been taken out, from 0. */
  index: number
}

export interface KanbanMove<T extends KanbanCard = KanbanCard> {
  card: T
  from: KanbanPlace
  to: KanbanPlace
}

type Direction = 'up' | 'down' | 'left' | 'right' | 'first' | 'last'

interface Pending {
  id: number
  card: string
  from: KanbanPlace
  to: KanbanPlace
}

export type KanbanAnnouncement =
  | { kind: 'lifted' | 'moved' | 'dropped' | 'cancelled' | 'placed'; card: string; column: string; position: number; total: number }
  | { kind: 'failed'; card: string; message: string }
  | { kind: 'added'; title: string; column: string }
  | { kind: 'add-failed'; title: string; message: string }

/** A card being added: shown at the end of its column, faded, until the owner answers. */
export interface KanbanPendingAdd {
  id: number
  column: string
  title: string
  /** The cards when it was sent: an answer that comes before the owner's new cards waits for them. */
  cards: KanbanCard[]
  settled: boolean
}

export interface KanbanState<T extends KanbanCard = KanbanCard> {
  id: string
  columns: KanbanColumn[]
  cards: T[]
  /** What is shown: each column's card ids, top to bottom. The cards as given, with the moves still out laid over them. */
  order: Record<string, string[]>
  /** The roving tab stop; `nonce` moves real focus there — after an arrow, and after a move re-renders the card elsewhere. */
  focus: { card: string | null; nonce: number }
  /** The card picked up — by the keyboard, or dragged by a pointer — and where it was. */
  lifted: { card: string; origin: KanbanPlace; by: 'keyboard' | 'pointer' } | null
  pending: Pending[]
  announcement: { value: KanbanAnnouncement | null; nonce: number }
  moveIntent: { value: Pending | null; nonce: number }
  openIntent: { value: string | null; nonce: number }
  /** A card's menu asked for: at the pointer, under its menu button, or under the card for the keyboard. */
  menu: { card: string | null; point: { x: number; y: number } | null; via: 'pointer' | 'keyboard' | 'button'; nonce: number }
  /** The column whose "Add a card" field is open, and what is typed in it. */
  adding: { column: string; draft: string } | null
  adds: KanbanPendingAdd[]
  addIntent: { value: KanbanPendingAdd | null; nonce: number }
  /** Where the focus goes for the add field: into it, or back to its column's button. */
  addFocus: { column: string | null; target: 'input' | 'trigger'; nonce: number }
}

export type KanbanEvent =
  | { type: 'FOCUS'; card: string }
  /** The focus left the board: a picked-up card goes back, and the focus is not pulled in again. */
  | { type: 'BLUR' }
  | { type: 'WALK'; direction: Direction }
  /** Pick up the focused card, or `card` — a pointer's drag names the card it started on. */
  | { type: 'LIFT'; card?: string; by?: 'keyboard' | 'pointer' }
  /** A dragged card is over this place: it is shown there. */
  | { type: 'PLACE'; to: KanbanPlace }
  | { type: 'SHIFT'; direction: Direction }
  | { type: 'DROP' }
  | { type: 'CANCEL' }
  /** A move made in one go — by a pointer, or a "Move to…" menu of your own. */
  | { type: 'MOVE'; card: string; to: KanbanPlace }
  | { type: 'SETTLE'; move: number; ok: boolean; message?: string }
  | { type: 'OPEN'; card?: string }
  /** Ask for a card's menu: a right click, Shift+F10 or the menu key, or its menu button. */
  | { type: 'MENU'; card: string; point?: { x: number; y: number }; via: 'pointer' | 'keyboard' | 'button' }
  | { type: 'ADD_OPEN'; column: string }
  | { type: 'ADD_DRAFT'; text: string }
  | { type: 'ADD_SUBMIT' }
  | { type: 'ADD_CLOSE'; refocus?: boolean }
  | { type: 'ADD_SETTLE'; add: number; ok: boolean; message?: string }
  | { type: 'SYNC_CARDS'; cards: KanbanCard[] }
  | { type: 'SYNC_COLUMNS'; columns: KanbanColumn[] }

export const kanbanAnatomy = createAnatomy('kanban', [
  'root',
  'column',
  'column-header',
  'column-title',
  'column-count',
  'list',
  'card',
  'card-title',
  'card-body',
  'card-menu',
  'card-menu-icon',
  'pending-card',
  'empty',
  'add-trigger',
  'add-trigger-icon',
  'add-form',
  'add-input',
  'add-actions',
  'add-submit',
  'add-cancel',
  'live',
  'instructions',
] as const)
export type KanbanPart = (typeof kanbanAnatomy.parts)[number]

/** Each column's card ids, in the order the cards are given. A card of a column that is not there is not shown. */
export function orderOf(columns: KanbanColumn[], cards: KanbanCard[]): Record<string, string[]> {
  const order: Record<string, string[]> = {}
  for (const column of columns) order[column.id] = []
  for (const card of cards) order[card.column]?.push(card.id)
  return order
}

export function placeOf(order: Record<string, string[]>, card: string): KanbanPlace | null {
  for (const [column, ids] of Object.entries(order)) {
    const index = ids.indexOf(card)
    if (index !== -1) return { column, index }
  }
  return null
}

/** The order with `card` taken out and put at `to`, the index clamped to the column. */
export function moveInOrder(order: Record<string, string[]>, card: string, to: KanbanPlace): Record<string, string[]> {
  if (!order[to.column]) return order
  const next: Record<string, string[]> = {}
  for (const [column, ids] of Object.entries(order)) next[column] = ids.filter((id) => id !== card)
  const target = next[to.column]
  target.splice(Math.max(0, Math.min(to.index, target.length)), 0, card)
  return next
}

/**
 * The cards with a move applied: the card in its new column, and placed in
 * the array so that the column's order puts it at `to.index`. What an owner
 * does with `onMove` once the server agrees.
 */
export function applyMove<T extends KanbanCard>(cards: T[], move: { card: { id: string }; to: KanbanPlace }): T[] {
  const moving = cards.find((card) => card.id === move.card.id)
  if (!moving) return cards
  const rest = cards.filter((card) => card.id !== moving.id)
  const moved = { ...moving, column: move.to.column }
  const inColumn = rest.filter((card) => card.column === move.to.column)
  const before = inColumn[move.to.index]
  if (before) {
    const at = rest.indexOf(before)
    return [...rest.slice(0, at), moved, ...rest.slice(at)]
  }
  const last = inColumn[inColumn.length - 1]
  const at = last ? rest.indexOf(last) + 1 : rest.length
  return [...rest.slice(0, at), moved, ...rest.slice(at)]
}

const samePlace = (a: KanbanPlace, b: KanbanPlace) => a.column === b.column && a.index === b.index

function announce<T extends KanbanCard>(state: KanbanState<T>, value: KanbanAnnouncement): KanbanState<T> {
  return { ...state, announcement: { value, nonce: state.announcement.nonce + 1 } }
}

function where<T extends KanbanCard>(state: KanbanState<T>, kind: 'lifted' | 'moved' | 'dropped' | 'cancelled' | 'placed', card: string): KanbanState<T> {
  const place = placeOf(state.order, card)
  if (!place) return state
  return announce(state, { kind, card, column: place.column, position: place.index + 1, total: state.order[place.column].length })
}

const refocus = <T extends KanbanCard>(state: KanbanState<T>, card: string | null): KanbanState<T> => ({ ...state, focus: { card, nonce: state.focus.nonce + 1 } })

/** The next place a direction reaches from `place`, for walking the focus (`walk`) or carrying a card (`carry`). */
function reach(state: KanbanState, place: KanbanPlace, direction: Direction, mode: 'walk' | 'carry'): KanbanPlace | null {
  // Up and down stay in the column, the card itself counted either way.
  const last = (state.order[place.column]?.length ?? 0) - 1
  switch (direction) {
    case 'up':
      return place.index > 0 ? { ...place, index: place.index - 1 } : null
    case 'down':
      return place.index < last ? { ...place, index: place.index + 1 } : null
    case 'first':
      return place.index > 0 ? { ...place, index: 0 } : null
    case 'last':
      return place.index < last ? { ...place, index: last } : null
    case 'left':
    case 'right': {
      const step = direction === 'right' ? 1 : -1
      const columns = state.columns.map((column) => column.id)
      for (let i = columns.indexOf(place.column) + step; i >= 0 && i < columns.length; i += step) {
        const length = state.order[columns[i]]?.length ?? 0
        // Walking passes over an empty column; carrying may put a card into one.
        if (mode === 'walk' && length === 0) continue
        return { column: columns[i], index: Math.min(place.index, mode === 'walk' ? length - 1 : length) }
      }
      return null
    }
  }
}

function startMove<T extends KanbanCard>(state: KanbanState<T>, card: string, from: KanbanPlace, to: KanbanPlace): KanbanState<T> {
  const move: Pending = { id: state.moveIntent.nonce + 1, card, from, to }
  return { ...state, pending: [...state.pending, move], moveIntent: { value: move, nonce: move.id } }
}

export function reducer<T extends KanbanCard>(state: KanbanState<T>, event: KanbanEvent): KanbanState<T> {
  switch (event.type) {
    case 'FOCUS': {
      if (!placeOf(state.order, event.card)) return state
      // The focus went to another card while one was up: that one goes back first.
      const settled = state.lifted && state.lifted.card !== event.card ? putBack(state, false) : state
      return settled.focus.card === event.card ? settled : { ...settled, focus: { card: event.card, nonce: settled.focus.nonce } }
    }

    case 'BLUR':
      // A drag re-renders the card it carries, and the focus goes for a moment: that is not leaving.
      return state.lifted && state.lifted.by === 'keyboard' ? putBack(state, false) : state

    case 'WALK': {
      const from = tabStop(state)
      const place = from && placeOf(state.order, from)
      const to = place && reach(state, place, event.direction, 'walk')
      return to ? refocus(state, state.order[to.column][to.index]) : state
    }

    case 'LIFT': {
      const card = event.card ?? tabStop(state)
      const place = card && placeOf(state.order, card)
      if (!card || !place || state.lifted) return state
      const by = event.by ?? 'keyboard'
      return where({ ...state, lifted: { card, origin: place, by }, focus: { card, nonce: state.focus.nonce } }, 'lifted', card)
    }

    case 'PLACE': {
      if (!state.lifted) return state
      const { card } = state.lifted
      const place = placeOf(state.order, card)
      if (!place || !state.order[event.to.column]) return state
      const order = moveInOrder(state.order, card, event.to)
      const to = placeOf(order, card)!
      return samePlace(place, to) ? state : { ...state, order }
    }

    case 'SHIFT': {
      if (!state.lifted) return state
      const { card } = state.lifted
      const place = placeOf(state.order, card)
      const to = place && reach(state, place, event.direction, 'carry')
      if (!to) return state
      return where(refocus({ ...state, order: moveInOrder(state.order, card, to) }, card), 'moved', card)
    }

    case 'DROP': {
      if (!state.lifted) return state
      const { card, origin } = state.lifted
      const place = placeOf(state.order, card)!
      // After a drag the card's element may have been re-rendered: the focus is put back on it.
      const settled = state.lifted.by === 'pointer' ? refocus(state, card) : state
      const dropped = where({ ...settled, lifted: null }, 'dropped', card)
      return samePlace(place, origin) ? dropped : startMove(dropped, card, origin, place)
    }

    case 'CANCEL':
      return state.lifted ? putBack(state, true) : state

    case 'MOVE': {
      const from = placeOf(state.order, event.card)
      if (!from || !state.order[event.to.column]) return state
      const order = moveInOrder(state.order, event.card, event.to)
      const to = placeOf(order, event.card)!
      if (samePlace(from, to)) return state
      return where(startMove(refocus({ ...state, order, lifted: null }, event.card), event.card, from, to), 'placed', event.card)
    }

    case 'SETTLE': {
      const move = state.pending.find((candidate) => candidate.id === event.move)
      if (!move) return state
      const rest = state.pending.filter((candidate) => candidate !== move)
      const next = { ...state, pending: rest }
      // An answer to a move since overtaken by another of the same card says nothing.
      const overtaken = rest.some((candidate) => candidate.card === move.card && candidate.id > move.id)
      if (event.ok || overtaken) return next
      const back = { ...next, order: moveInOrder(next.order, move.card, move.from) }
      const focused = state.focus.card === move.card ? refocus(back, move.card) : back
      return announce(focused, { kind: 'failed', card: move.card, message: event.message ?? '' })
    }

    case 'OPEN': {
      const card = event.card ?? tabStop(state)
      if (!card || state.lifted) return state
      return { ...state, openIntent: { value: card, nonce: state.openIntent.nonce + 1 } }
    }

    case 'MENU': {
      if (state.lifted || !placeOf(state.order, event.card)) return state
      return {
        ...state,
        focus: { card: event.card, nonce: state.focus.nonce },
        menu: { card: event.card, point: event.point ?? null, via: event.via, nonce: state.menu.nonce + 1 },
      }
    }

    case 'ADD_OPEN':
      if (!state.order[event.column]) return state
      return {
        ...state,
        adding: { column: event.column, draft: state.adding?.column === event.column ? state.adding.draft : '' },
        addFocus: { column: event.column, target: 'input', nonce: state.addFocus.nonce + 1 },
      }

    case 'ADD_DRAFT':
      return state.adding ? { ...state, adding: { ...state.adding, draft: event.text } } : state

    case 'ADD_SUBMIT': {
      const title = state.adding?.draft.trim()
      if (!state.adding || !title) return state
      const add: KanbanPendingAdd = { id: state.addIntent.nonce + 1, column: state.adding.column, title, cards: state.cards, settled: false }
      // The field stays open, empty, with the focus in it: the next card is typed straight after.
      return {
        ...state,
        adding: { ...state.adding, draft: '' },
        adds: [...state.adds, add],
        addIntent: { value: add, nonce: add.id },
        addFocus: { column: add.column, target: 'input', nonce: state.addFocus.nonce + 1 },
      }
    }

    case 'ADD_CLOSE': {
      if (!state.adding) return state
      const { column } = state.adding
      const closed = { ...state, adding: null }
      return event.refocus ? { ...closed, addFocus: { column, target: 'trigger' as const, nonce: state.addFocus.nonce + 1 } } : closed
    }

    case 'ADD_SETTLE': {
      const add = state.adds.find((candidate) => candidate.id === event.add)
      if (!add) return state
      const rest = state.adds.filter((candidate) => candidate !== add)
      if (!event.ok) {
        // The title comes back to the field, if the field is still open on that column and empty.
        const adding = state.adding && state.adding.column === add.column && state.adding.draft === '' ? { ...state.adding, draft: add.title } : state.adding
        return announce({ ...state, adds: rest, adding }, { kind: 'add-failed', title: add.title, message: event.message ?? '' })
      }
      const said = announce(state, { kind: 'added', title: add.title, column: add.column })
      // The owner's new cards already came: the stand-in goes. Not yet: it waits for them.
      return add.cards !== state.cards ? { ...said, adds: rest } : { ...said, adds: state.adds.map((candidate) => (candidate === add ? { ...add, settled: true } : candidate)) }
    }

    case 'SYNC_CARDS': {
      if (event.cards === state.cards) return state
      const cards = event.cards as T[]
      let order = orderOf(state.columns, cards)
      // The moves still out stand over the cards as given, until they are answered.
      for (const move of state.pending) order = moveInOrder(order, move.card, move.to)
      let lifted = state.lifted
      if (lifted) {
        const at = placeOf(state.order, lifted.card)
        lifted = at && cards.some((card) => card.id === lifted!.card) ? lifted : null
        if (lifted && at) order = moveInOrder(order, lifted.card, at)
      }
      return { ...state, cards, order, lifted, adds: state.adds.filter((add) => !add.settled) }
    }

    case 'SYNC_COLUMNS': {
      if (event.columns === state.columns) return state
      let order = orderOf(event.columns, state.cards)
      for (const move of state.pending) order = moveInOrder(order, move.card, move.to)
      return { ...state, columns: event.columns, order }
    }
  }
}

/** Put the picked-up card back where it was picked up. */
function putBack<T extends KanbanCard>(state: KanbanState<T>, pullFocus: boolean): KanbanState<T> {
  const { card, origin } = state.lifted!
  const back = { ...state, order: moveInOrder(state.order, card, origin), lifted: null }
  return where(pullFocus ? refocus(back, card) : back, 'cancelled', card)
}

/** The tab stop: the focused card while it is shown, or the first card of the board. */
export function tabStop(state: KanbanState): string | null {
  if (state.focus.card && placeOf(state.order, state.focus.card)) return state.focus.card
  for (const column of state.columns) {
    const first = state.order[column.id]?.[0]
    if (first) return first
  }
  return null
}

export interface KanbanMachineConfig<T extends KanbanCard> {
  id: string
  columns: KanbanColumn[]
  cards: T[]
  /**
   * A card was moved. It is shown there at once; return a promise to say
   * whether the move holds — a rejection puts the card back and says why, the
   * error's message read out. Apply the move to your cards (`applyMove`) when
   * it holds: the board shows the cards it is given.
   */
  onMove?: (move: KanbanMove<T>) => Promise<unknown> | unknown
  /** Enter on a card, or a press on it: open it. */
  onOpen?: (card: T) => void
  /**
   * A card was typed into a column's "Add a card" field. It stands at the end
   * of the column, faded, until this answers: add it to your cards, then
   * resolve. A rejection takes it away and puts the title back in the field.
   */
  onAdd?: (column: string, title: string) => Promise<unknown> | unknown
}

export function initialState<T extends KanbanCard>(config: KanbanMachineConfig<T>): KanbanState<T> {
  return {
    id: config.id,
    columns: config.columns,
    cards: config.cards,
    order: orderOf(config.columns, config.cards),
    focus: { card: null, nonce: 0 },
    lifted: null,
    pending: [],
    announcement: { value: null, nonce: 0 },
    moveIntent: { value: null, nonce: 0 },
    openIntent: { value: null, nonce: 0 },
    menu: { card: null, point: null, via: 'keyboard', nonce: 0 },
    adding: null,
    adds: [],
    addIntent: { value: null, nonce: 0 },
    addFocus: { column: null, target: 'input', nonce: 0 },
  }
}

const messageOf = (error: unknown) => (error instanceof Error ? error.message : typeof error === 'string' ? error : '')

export function createKanbanMachine<T extends KanbanCard>(config: KanbanMachineConfig<T>): Machine<KanbanState<T>, KanbanEvent> {
  const machine = createMachine(initialState(config), reducer as (state: KanbanState<T>, event: KanbanEvent) => KanbanState<T>)
  // Answers are sent to the machine with its effects, so what they change is heard too.
  const wrapped: Machine<KanbanState<T>, KanbanEvent> = withEffects(machine, (previous, next) => {
    if (next.openIntent.nonce !== previous.openIntent.nonce && next.openIntent.value) {
      const card = next.cards.find((candidate) => candidate.id === next.openIntent.value)
      if (card) config.onOpen?.(card)
    }
    if (next.addIntent.nonce !== previous.addIntent.nonce && next.addIntent.value) {
      const add = next.addIntent.value
      Promise.resolve()
        .then(() => config.onAdd?.(add.column, add.title))
        .then(
          () => wrapped.send({ type: 'ADD_SETTLE', add: add.id, ok: true }),
          (error) => wrapped.send({ type: 'ADD_SETTLE', add: add.id, ok: false, message: messageOf(error) })
        )
    }
    if (next.moveIntent.nonce !== previous.moveIntent.nonce && next.moveIntent.value) {
      const move = next.moveIntent.value
      const card = next.cards.find((candidate) => candidate.id === move.card)
      if (!card) return
      Promise.resolve()
        .then(() => config.onMove?.({ card, from: move.from, to: move.to }))
        .then(
          () => wrapped.send({ type: 'SETTLE', move: move.id, ok: true }),
          (error) => wrapped.send({ type: 'SETTLE', move: move.id, ok: false, message: messageOf(error) })
        )
    }
  })
  return wrapped
}

export interface KanbanWords {
  /** The board's accessible name. */
  label: string
  /** What a card is called to a screen reader: "Call Aigul, card". */
  card: string
  instructions: string
  lifted: (card: string, column: string, position: number, total: number) => string
  moved: (card: string, column: string, position: number, total: number) => string
  dropped: (card: string, column: string, position: number, total: number) => string
  cancelled: (card: string, column: string, position: number, total: number) => string
  failed: (card: string, message: string) => string
  /** A card moved in one go, from its menu: "Call Aigul moved to Doing, 2 of 3." */
  placed: (card: string, column: string, position: number, total: number) => string
  /** The name of a card's menu, and of its button. */
  menu: (card: string) => string
  moveTo: string
  moveToTop: string
  moveToBottom: string
  addCard: string
  /** The add field's name, for its column. */
  addLabel: (column: string) => string
  addSubmit: string
  addCancel: string
  added: (title: string, column: string) => string
  addFailed: (title: string, message: string) => string
  /** A column's count, with its limit when it has one. */
  count: (count: number, limit?: number) => string
  empty: string
}

export interface KanbanConnectOptions {
  /** The heading level of each column's title. Default 3. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
}

/** The values of the menu items the board adds itself. */
export const KANBAN_MENU = { move: 'gg-kanban-move', moveTo: 'gg-kanban-move:', top: 'gg-kanban-top', bottom: 'gg-kanban-bottom' } as const

/** A card's menu: "Move to" each other column, to the top or the bottom of its own — then yours, after a separator. */
export function cardMenuItems(state: KanbanState, card: string, words: Partial<KanbanWords> = {}, own: MenuEntry[] = []): MenuEntry[] {
  const w = { ...KANBAN_WORDS, ...words }
  const place = placeOf(state.order, card)
  if (!place) return own
  const last = (state.order[place.column]?.length ?? 1) - 1
  const others = state.columns.filter((column) => column.id !== place.column)
  const board: MenuEntry[] = [
    { type: 'submenu', value: KANBAN_MENU.move, label: w.moveTo, disabled: others.length === 0, items: others.map((column) => ({ value: `${KANBAN_MENU.moveTo}${column.id}`, label: column.title })) },
    { value: KANBAN_MENU.top, label: w.moveToTop, disabled: place.index === 0 },
    { value: KANBAN_MENU.bottom, label: w.moveToBottom, disabled: place.index === last },
  ]
  return own.length === 0 ? board : [...board, { type: 'separator' }, ...own]
}

/** Where a board menu item sends the card; null for an item that is yours. Another column: its end. */
export function cardMenuPlace(state: KanbanState, card: string, value: string): KanbanPlace | null {
  const place = placeOf(state.order, card)
  if (!place) return null
  if (value === KANBAN_MENU.top) return { column: place.column, index: 0 }
  if (value === KANBAN_MENU.bottom) return { column: place.column, index: state.order[place.column].length - 1 }
  if (value.startsWith(KANBAN_MENU.moveTo)) {
    const column = value.slice(KANBAN_MENU.moveTo.length)
    return state.order[column] ? { column, index: state.order[column].length } : null
  }
  return null
}

export const KANBAN_WORDS: KanbanWords = {
  label: 'Board',
  card: 'card',
  instructions: 'Press Space to pick the card up; the arrows move it, Space drops it, Escape puts it back. Enter opens it; Shift+F10 opens its menu.',
  lifted: (card, column, position, total) => `Picked up ${card}. ${column}, ${position} of ${total}.`,
  moved: (_card, column, position, total) => `${column}, ${position} of ${total}.`,
  dropped: (card, column, position, total) => `Dropped ${card} in ${column}, ${position} of ${total}.`,
  cancelled: (card, column, position, total) => `${card} put back in ${column}, ${position} of ${total}.`,
  failed: (card, message) => (message ? `${card} was not moved: ${message}` : `${card} was not moved.`),
  placed: (card, column, position, total) => `${card} moved to ${column}, ${position} of ${total}.`,
  menu: (card) => `Actions for ${card}`,
  moveTo: 'Move to',
  moveToTop: 'Move to top',
  moveToBottom: 'Move to bottom',
  addCard: 'Add a card',
  addLabel: (column) => `New card in ${column}`,
  addSubmit: 'Add card',
  addCancel: 'Cancel',
  added: (title, column) => `Added ${title} to ${column}.`,
  addFailed: (title, message) => (message ? `${title} was not added: ${message}` : `${title} was not added.`),
  count: (count, limit) => (limit === undefined ? String(count) : `${count} / ${limit}`),
  empty: 'No cards',
}

const idPart = (value: string) => value.replace(/[^\w-]/g, (char) => `_${char.charCodeAt(0).toString(16)}`)

export const kanbanIds = (id: string) => ({
  root: id,
  instructions: `${id}-instructions`,
  columnTitle: (column: string) => `${id}-column-${idPart(column)}-title`,
  card: (card: string) => `${id}-card-${idPart(card)}`,
  cardTitle: (card: string) => `${id}-card-${idPart(card)}-title`,
  cardBody: (card: string) => `${id}-card-${idPart(card)}-body`,
  cardMenu: (card: string) => `${id}-card-${idPart(card)}-menu`,
  addTrigger: (column: string) => `${id}-column-${idPart(column)}-add`,
  addInput: (column: string) => `${id}-column-${idPart(column)}-add-input`,
})

/** Run a keyboard move with the cards animating to their new places. */
function withFlip(event: KeyboardEvent, change: () => void, prevent?: KeyboardEvent) {
  prevent?.preventDefault()
  const root = (event.currentTarget as Element | null)?.closest?.('[data-scope="kanban"][data-part="root"]')
  if (root instanceof HTMLElement) flipKanban(root, change)
  else change()
}

/** A press on these inside a card is theirs, not the card's. */
const INTERACTIVE = 'a[href], button, input, select, textarea, summary, [role="button"], [role="checkbox"], [role="link"], [role="menuitem"]'

export function connect<T extends KanbanCard, P = Dict>(state: KanbanState<T>, send: (event: KanbanEvent) => void, normalize: Normalizer<P>, options: KanbanConnectOptions & { words?: Partial<KanbanWords> } = {}) {
  const { words = {} } = options
  const w = { ...KANBAN_WORDS, ...words }
  const ids = kanbanIds(state.id)
  const stop = tabStop(state)
  const byId = new Map(state.cards.map((card) => [card.id, card]))
  const titleOf = (id: string) => byId.get(id)?.title ?? id
  const columnTitle = (id: string) => state.columns.find((column) => column.id === id)?.title ?? id
  const pendingCards = new Set(state.pending.map((move) => move.card))

  const said = state.announcement.value
  const announcement = !said
    ? ''
    : said.kind === 'failed'
      ? w.failed(titleOf(said.card), said.message)
      : said.kind === 'added'
        ? w.added(said.title, columnTitle(said.column))
        : said.kind === 'add-failed'
          ? w.addFailed(said.title, said.message)
          : w[said.kind](titleOf(said.card), columnTitle(said.column), said.position, said.total)

  const rtl = (event: KeyboardEvent) => (event.currentTarget as Element | null)?.closest?.('[dir]')?.getAttribute('dir') === 'rtl'
  const onCardKeyDown = (event: KeyboardEvent) => {
    if (event.target !== event.currentTarget || event.ctrlKey || event.metaKey || event.altKey) return
    if (event.key === 'F10' && !event.shiftKey) return
    // A key comes from the card that has the focus, whatever the board last
    // heard: a focus event can be missed (a window without system focus fires
    // none), and the key must act on this card, not on the one before.
    const own = (event.currentTarget as HTMLElement | null)?.dataset?.card
    if (own && own !== state.focus.card) send({ type: 'FOCUS', card: own })
    const flip = rtl(event)
    const directions: Record<string, Direction> = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: flip ? 'right' : 'left',
      ArrowRight: flip ? 'left' : 'right',
      Home: 'first',
      End: 'last',
    }
    const direction = directions[event.key]
    const handled = (sent: KanbanEvent) => {
      event.preventDefault()
      send(sent)
    }
    if (state.lifted?.by === 'pointer') {
      // The pointer carries it; only Escape is the keyboard's.
      if (event.key === 'Escape') handled({ type: 'CANCEL' })
      return
    }
    if (state.lifted) {
      if (direction) return withFlip(event, () => send({ type: 'SHIFT', direction }), event)
      if (event.key === 'Escape') return withFlip(event, () => send({ type: 'CANCEL' }), event)
      if (event.key === ' ' || event.key === 'Enter') return handled({ type: 'DROP' })
      // Tab carries the focus out; BLUR puts the card back.
      return
    }
    // Shift+F10 and the menu key are the keyboard's right click.
    if (event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey)) {
      const own = (event.currentTarget as HTMLElement | null)?.dataset?.card
      if (own) return handled({ type: 'MENU', card: own, via: 'keyboard' })
    }
    if (direction) return handled({ type: 'WALK', direction })
    if (event.key === ' ') return handled({ type: 'LIFT' })
    if (event.key === 'Enter') return handled({ type: 'OPEN' })
  }

  return {
    ids,
    words: w,
    announcement,
    /** Watch this: when it changes, move real focus to the card `focusCard`. */
    focusNonce: state.focus.nonce,
    focusCard: state.focus.card,
    lifted: state.lifted?.card ?? null,
    columns: state.columns.map((column) => ({
      column,
      cards: (state.order[column.id] ?? []).map((id) => byId.get(id)).filter((card): card is T => card !== undefined),
      /** Cards typed in and not yet answered: shown after the others, faded. */
      adds: state.adds.filter((add) => add.column === column.id),
    })),
    move: (card: string, to: KanbanPlace) => send({ type: 'MOVE', card, to }),

    rootProps: normalize({
      ...kanbanAnatomy.attrs('root'),
      id: ids.root,
      role: 'group',
      'aria-label': w.label,
      'data-lifting': state.lifted ? '' : undefined,
      'data-dragging': state.lifted?.by === 'pointer' ? '' : undefined,
      // Leaving the board with a card up puts it back. A move re-renders the card
      // elsewhere and blurs it for a moment, so wait for the focus to land.
      onFocusOut: (event: FocusEvent) => {
        const root = event.currentTarget as HTMLElement | null
        if (!root) return
        setTimeout(() => {
          if (!root.contains(root.ownerDocument.activeElement)) send({ type: 'BLUR' })
        })
      },
    }),

    getColumnProps: (column: KanbanColumn) => {
      const count = state.order[column.id]?.length ?? 0
      return normalize({
        ...kanbanAnatomy.attrs('column'),
        'data-column': column.id,
        'data-over': column.limit !== undefined && count > column.limit ? '' : undefined,
        'data-empty': count === 0 ? '' : undefined,
      })
    },
    columnHeaderProps: normalize({ ...kanbanAnatomy.attrs('column-header') }),
    getColumnTitleProps: (column: KanbanColumn) =>
      normalize({ ...kanbanAnatomy.attrs('column-title'), id: ids.columnTitle(column.id), role: 'heading', 'aria-level': options.headingLevel ?? 3 }),
    getColumnCountProps: (column: KanbanColumn) => {
      const count = state.order[column.id]?.length ?? 0
      return normalize({
        ...kanbanAnatomy.attrs('column-count'),
        'data-over': column.limit !== undefined && count > column.limit ? '' : undefined,
      })
    },
    countText: (column: KanbanColumn) => w.count(state.order[column.id]?.length ?? 0, column.limit),
    getListProps: (column: KanbanColumn) =>
      normalize({
        ...kanbanAnatomy.attrs('list'),
        role: 'list',
        'aria-labelledby': ids.columnTitle(column.id),
        // A list that scrolls would be a tab stop of its own in Chrome, one per
        // column, since its cards are out of the tab order. The cards scroll it.
        tabIndex: -1,
        'data-column': column.id,
      }),
    emptyProps: normalize({ ...kanbanAnatomy.attrs('empty') }),

    getCardProps: (card: T) => {
      const lifted = state.lifted?.card === card.id
      return normalize({
        ...kanbanAnatomy.attrs('card'),
        id: ids.card(card.id),
        role: 'listitem',
        'aria-roledescription': w.card,
        'aria-labelledby': ids.cardTitle(card.id),
        'aria-describedby': `${ids.cardBody(card.id)} ${ids.instructions}`,
        tabIndex: card.id === stop ? 0 : -1,
        'data-card': card.id,
        'data-lifted': lifted ? '' : undefined,
        // Dragged, the card in the list is the place it would land; a copy follows the pointer.
        'data-dragging': lifted && state.lifted?.by === 'pointer' ? '' : undefined,
        'data-pending': pendingCards.has(card.id) ? '' : undefined,
        onKeyDown: onCardKeyDown,
        onFocusIn: (event: FocusEvent) => {
          if (event.target === event.currentTarget) send({ type: 'FOCUS', card: card.id })
        },
        onClick: (event: MouseEvent) => {
          const target = event.target as Element | null
          const inner = target?.closest?.(INTERACTIVE)
          if (inner && inner !== event.currentTarget && (event.currentTarget as Element).contains(inner)) return
          send({ type: 'OPEN', card: card.id })
        },
        onContextMenu: (event: MouseEvent) => {
          if (state.lifted) return
          event.preventDefault()
          send({ type: 'MENU', card: card.id, point: { x: event.clientX, y: event.clientY }, via: 'pointer' })
        },
      })
    },

    /** The card's menu button: for a pointer, and on a touch screen, which has no right click. Out of the tab order: Shift+F10 is the keyboard's. */
    getCardMenuProps: (card: T) =>
      normalize({
        ...kanbanAnatomy.attrs('card-menu'),
        id: ids.cardMenu(card.id),
        type: 'button',
        tabIndex: -1,
        'aria-label': w.menu(card.title),
        'aria-haspopup': 'menu',
        onClick: (event: MouseEvent) => {
          event.stopPropagation()
          send({ type: 'MENU', card: card.id, via: 'button' })
        },
      }),
    cardMenuIconProps: normalize({ ...kanbanAnatomy.attrs('card-menu-icon'), 'aria-hidden': 'true', 'data-icon': 'more' satisfies IconName }),
    /** Watch this: when it changes, open the card menu for `menuRequest.card`. */
    menuRequest: state.menu,
    getPendingCardProps: (add: KanbanPendingAdd) =>
      normalize({ ...kanbanAnatomy.attrs('pending-card'), role: 'listitem', 'aria-busy': 'true', 'data-pending': '', 'data-add': add.id }),

    adding: state.adding?.column ?? null,
    draft: state.adding?.draft ?? '',
    /** Watch this: when it changes, move real focus to `addFocusId`. */
    addFocusNonce: state.addFocus.nonce,
    addFocusId: state.addFocus.column === null ? null : state.addFocus.target === 'input' ? ids.addInput(state.addFocus.column) : ids.addTrigger(state.addFocus.column),
    getAddTriggerProps: (column: KanbanColumn) =>
      normalize({
        ...kanbanAnatomy.attrs('add-trigger'),
        id: ids.addTrigger(column.id),
        type: 'button',
        'data-column': column.id,
        onClick: () => send({ type: 'ADD_OPEN', column: column.id }),
      }),
    addTriggerIconProps: normalize({ ...kanbanAnatomy.attrs('add-trigger-icon'), 'aria-hidden': 'true', 'data-icon': 'plus' satisfies IconName }),
    getAddFormProps: (column: KanbanColumn) =>
      normalize({
        ...kanbanAnatomy.attrs('add-form'),
        'data-column': column.id,
        // Leaving an empty field closes it; a field with a title in it stays, the title kept.
        onFocusOut: (event: FocusEvent) => {
          const form = event.currentTarget as HTMLElement | null
          const next = event.relatedTarget as Node | null
          if (form && next && form.contains(next)) return
          if (!state.adding?.draft.trim()) send({ type: 'ADD_CLOSE' })
        },
      }),
    getAddInputProps: (column: KanbanColumn) =>
      normalize({
        ...kanbanAnatomy.attrs('add-input'),
        id: ids.addInput(column.id),
        'aria-label': w.addLabel(column.title),
        rows: 2,
        value: state.adding?.column === column.id ? state.adding.draft : '',
        onInput: (event: Event) => send({ type: 'ADD_DRAFT', text: (event.target as HTMLTextAreaElement).value }),
        onKeyDown: (event: KeyboardEvent) => {
          if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
            event.preventDefault()
            send({ type: 'ADD_SUBMIT' })
          } else if (event.key === 'Escape') {
            event.preventDefault()
            event.stopPropagation()
            send({ type: 'ADD_CLOSE', refocus: true })
          }
        },
      }),
    addActionsProps: normalize({ ...kanbanAnatomy.attrs('add-actions') }),
    addSubmitProps: normalize({ ...kanbanAnatomy.attrs('add-submit'), type: 'button', onClick: () => send({ type: 'ADD_SUBMIT' }) }),
    addCancelProps: normalize({ ...kanbanAnatomy.attrs('add-cancel'), type: 'button', onClick: () => send({ type: 'ADD_CLOSE', refocus: true }) }),
    getCardTitleProps: (card: T) => normalize({ ...kanbanAnatomy.attrs('card-title'), id: ids.cardTitle(card.id) }),
    getCardBodyProps: (card: T) => normalize({ ...kanbanAnatomy.attrs('card-body'), id: ids.cardBody(card.id) }),

    liveProps: normalize({ ...kanbanAnatomy.attrs('live'), 'aria-live': 'assertive', 'aria-atomic': 'true' }),
    instructionsProps: normalize({ ...kanbanAnatomy.attrs('instructions'), id: ids.instructions }),
  }
}

/**
 * Move real focus to a card and bring it into view — the board scrolls
 * sideways and a column may scroll down, so a card carried off the edge would
 * otherwise go on out of sight.
 */
export function focusKanbanCard(doc: Document, id: string): void {
  const card = doc.getElementById(id)
  if (!card) return
  if (doc.activeElement !== card) card.focus({ preventScroll: true })
  if (typeof card.scrollIntoView === 'function') card.scrollIntoView({ block: 'nearest', inline: 'nearest' })
}

export type KanbanApi<T extends KanbanCard = KanbanCard, P = Dict> = ReturnType<typeof connect<T, P>>
