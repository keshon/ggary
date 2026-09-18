import { createMachine, withEffects, type Machine } from '../../machine'
import { createAnatomy, type Dict, type Normalizer } from '../../types'
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
  | { kind: 'lifted' | 'moved' | 'dropped' | 'cancelled'; card: string; column: string; position: number; total: number }
  | { kind: 'failed'; card: string; message: string }

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
  'empty',
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

function where<T extends KanbanCard>(state: KanbanState<T>, kind: 'lifted' | 'moved' | 'dropped' | 'cancelled', card: string): KanbanState<T> {
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
      return where(startMove(refocus({ ...state, order, lifted: null }, event.card), event.card, from, to), 'dropped', event.card)
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
      return { ...state, cards, order, lifted }
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
  }
}

const messageOf = (error: unknown) => (error instanceof Error ? error.message : typeof error === 'string' ? error : '')

export function createKanbanMachine<T extends KanbanCard>(config: KanbanMachineConfig<T>): Machine<KanbanState<T>, KanbanEvent> {
  const machine = createMachine(initialState(config), reducer as (state: KanbanState<T>, event: KanbanEvent) => KanbanState<T>)
  return withEffects(machine, (previous, next) => {
    if (next.openIntent.nonce !== previous.openIntent.nonce && next.openIntent.value) {
      const card = next.cards.find((candidate) => candidate.id === next.openIntent.value)
      if (card) config.onOpen?.(card)
    }
    if (next.moveIntent.nonce !== previous.moveIntent.nonce && next.moveIntent.value) {
      const move = next.moveIntent.value
      const card = next.cards.find((candidate) => candidate.id === move.card)
      if (!card) return
      Promise.resolve()
        .then(() => config.onMove?.({ card, from: move.from, to: move.to }))
        .then(
          () => machine.send({ type: 'SETTLE', move: move.id, ok: true }),
          (error) => machine.send({ type: 'SETTLE', move: move.id, ok: false, message: messageOf(error) })
        )
    }
  })
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
  /** A column's count, with its limit when it has one. */
  count: (count: number, limit?: number) => string
  empty: string
}

export interface KanbanConnectOptions {
  /** The heading level of each column's title. Default 3. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
}

export const KANBAN_WORDS: KanbanWords = {
  label: 'Board',
  card: 'card',
  instructions: 'Press Space to pick the card up; the arrows move it, Space drops it, Escape puts it back. Enter opens it.',
  lifted: (card, column, position, total) => `Picked up ${card}. ${column}, ${position} of ${total}.`,
  moved: (_card, column, position, total) => `${column}, ${position} of ${total}.`,
  dropped: (card, column, position, total) => `Dropped ${card} in ${column}, ${position} of ${total}.`,
  cancelled: (card, column, position, total) => `${card} put back in ${column}, ${position} of ${total}.`,
  failed: (card, message) => (message ? `${card} was not moved: ${message}` : `${card} was not moved.`),
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

export function connect<T extends KanbanCard, P = Dict>(state: KanbanState<T>, send: (event: KanbanEvent) => void, normalize: Normalizer<P>, words: Partial<KanbanWords> = {}, options: KanbanConnectOptions = {}) {
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
      : w[said.kind](titleOf(said.card), columnTitle(said.column), said.position, said.total)

  const rtl = (event: KeyboardEvent) => (event.currentTarget as Element | null)?.closest?.('[dir]')?.getAttribute('dir') === 'rtl'
  const onCardKeyDown = (event: KeyboardEvent) => {
    if (event.target !== event.currentTarget || event.ctrlKey || event.metaKey || event.altKey) return
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
      })
    },
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
