import type { Dict, Normalizer } from '../../types'
import type { IconName } from '@ggary/icons'
import type { MenuEntry } from '../menu'
import { flipKanban } from './kanban.drag'
import { kanbanAnatomy } from './kanban.anatomy'
import type { Direction, KanbanCard, KanbanColumn, KanbanConnectOptions, KanbanEvent, KanbanPendingAdd, KanbanPlace, KanbanState, KanbanWords } from './kanban.types'
import { tabStop } from './kanban.machine'
import { placeOf } from './kanban.order'

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
