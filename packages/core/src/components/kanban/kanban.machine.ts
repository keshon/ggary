import { createMachine, withEffects, type Machine } from '../../machine'
import type { Direction, KanbanAnnouncement, KanbanCard, KanbanColumn, KanbanEvent, KanbanMove, KanbanPendingAdd, KanbanPlace, KanbanState, Pending } from './kanban.types'
import { moveInOrder, orderOf, placeOf } from './kanban.order'

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
