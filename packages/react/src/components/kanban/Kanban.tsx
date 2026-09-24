import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import {
  attachKanbanDrag,
  cardMenuItems,
  cardMenuPlace,
  connect,
  createKanbanMachine,
  flipKanban,
  focusKanbanCard,
  type KanbanCard,
  type KanbanColumn,
  type KanbanMove,
  type KanbanWords,
} from '@ggary/core/kanban'
import { connect as connectMenu, createMenuMachine, type MenuEntry } from '@ggary/core/menu'
import { reactNormalizer, type VirtualElement } from '@ggary/core'
import { MenuContent } from '../menu/MenuContent'
import { useConfigured } from '../config-provider'

export interface KanbanProps<T extends KanbanCard> {
  columns: KanbanColumn[]
  /** Each card's column; within a column, the order given. */
  cards: T[]
  /**
   * A card was moved: it stands there at once. Return a promise to say whether
   * it holds — a rejection puts it back and reads out the error's message.
   * Apply it to `cards` (`applyMove`) when it holds.
   */
  onMove?: (move: KanbanMove<T>) => Promise<unknown> | unknown
  /** Enter on a card, or a press on it. */
  onOpen?: (card: T) => void
  /**
   * A card typed into a column's "Add a card" field. Without it, a column has
   * no such field. Add the card to `cards`, then resolve; a rejection puts the
   * title back in the field and reads out why.
   */
  onAdd?: (column: string, title: string) => Promise<unknown> | unknown
  /** Items of your own in a card's menu, after the board's "Move to". */
  cardMenu?: (card: T) => MenuEntry[]
  onCardMenuSelect?: (value: string, card: T) => void
  /** Whether a card may be dragged by a pointer. Default: all of them. The keyboard can still move it. */
  canDrag?: (card: T) => boolean
  /** What a card shows under its title. */
  children?: (card: T) => ReactNode
  /** The heading level of each column's title. Default 3. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
  /** The board's accessible name, and the words it says. */
  words?: Partial<KanbanWords>
}

/** Columns of cards, a card moved by the keyboard, a pointer or its menu. */
export function Kanban<T extends KanbanCard>(props: KanbanProps<T>) {
  props = useConfigured(props, { words: 'kanban' })
  const { columns, cards, onMove, onOpen, onAdd, cardMenu, onCardMenuSelect, canDrag, children, headingLevel, words } = props
  const id = `gg-kanban-${useId().replace(/:/g, '')}`
  const callbacks = useRef({ onMove, onOpen, onAdd, canDrag, cardMenu, onCardMenuSelect, words })
  callbacks.current = { onMove, onOpen, onAdd, canDrag, cardMenu, onCardMenuSelect, words }
  const [machine] = useState(() =>
    createKanbanMachine<T>({
      id,
      columns,
      cards,
      onMove: (move) => callbacks.current.onMove?.(move),
      onOpen: (card) => callbacks.current.onOpen?.(card),
      onAdd: (column, title) => callbacks.current.onAdd?.(column, title),
    })
  )
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const api = connect(state, machine.send, reactNormalizer, { words, headingLevel })

  useEffect(() => machine.send({ type: 'SYNC_COLUMNS', columns }), [machine, columns])
  useEffect(() => machine.send({ type: 'SYNC_CARDS', cards }), [machine, cards])

  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    return attachKanbanDrag(root, machine.send, {
      canDrag: (key) => {
        const card = machine.getState().cards.find((candidate) => candidate.id === key)
        return !!card && (callbacks.current.canDrag?.(card) ?? true)
      },
    })
  }, [machine])

  // A move re-renders the card in its new place: the focus goes with it.
  const lastFocusNonce = useRef(0)
  useLayoutEffect(() => {
    if (api.focusNonce === 0 || api.focusNonce === lastFocusNonce.current || api.focusCard === null) return
    lastFocusNonce.current = api.focusNonce
    focusKanbanCard(document, api.ids.card(api.focusCard))
  })
  const lastAddFocus = useRef(0)
  useLayoutEffect(() => {
    if (api.addFocusNonce === 0 || api.addFocusNonce === lastAddFocus.current || !api.addFocusId) return
    lastAddFocus.current = api.addFocusNonce
    document.getElementById(api.addFocusId)?.focus()
  })

  // One menu for the board, opened for a card: at the pointer, under its button, or under the card.
  const menuCard = useRef<string | null>(null)
  const menuAnchor = useRef<Element | VirtualElement | null>(null)
  const [menu] = useState(() =>
    createMenuMachine({
      id: `${id}-menu`,
      items: [],
      onSelect: (value) => {
        const key = menuCard.current
        if (!key) return
        const place = cardMenuPlace(machine.getState(), key, value)
        if (place) {
          const move = () => machine.send({ type: 'MOVE', card: key, to: place })
          if (rootRef.current) flipKanban(rootRef.current, move)
          else move()
          return
        }
        const card = machine.getState().cards.find((candidate) => candidate.id === key)
        if (card) callbacks.current.onCardMenuSelect?.(value, card)
      },
    })
  )
  const menuState = useSyncExternalStore(menu.subscribe, menu.getState, menu.getState)
  const menuTitle = state.cards.find((card) => card.id === state.menu.card)?.title ?? ''
  const menuApi = connectMenu(menuState, menu.send, reactNormalizer, { label: api.words.menu(menuTitle) })
  const menuNonce = api.menuRequest.nonce
  const ids = api.ids
  const idsRef = useRef(ids)
  idsRef.current = ids
  useEffect(() => {
    const ids = idsRef.current
    const request = machine.getState().menu
    if (!request.nonce || !request.card) return
    const key = request.card
    const card = machine.getState().cards.find((candidate) => candidate.id === key)
    if (!card) return
    menuCard.current = key
    const element = document.getElementById(ids.card(key))
    const point = request.point
    menuAnchor.current = point
      ? { getBoundingClientRect: () => new DOMRect(point.x, point.y, 0, 0), contextElement: element ?? undefined }
      : request.via === 'button'
        ? document.getElementById(ids.cardMenu(key))
        : element
    menu.send({ type: 'SYNC_ITEMS', items: cardMenuItems(machine.getState(), key, callbacks.current.words, callbacks.current.cardMenu?.(card) ?? []) })
    // The keyboard lands on the first item; a pointer, on the menu itself.
    menu.send({ type: 'OPEN', reason: 'api', focus: request.via === 'pointer' ? 'none' : 'first' })
    // Only a new request opens it: a re-render is not one.
  }, [machine, menu, menuNonce])

  return (
    <div ref={rootRef} {...api.rootProps}>
      {api.columns.map(({ column, cards: inColumn, adds }) => (
        <section key={column.id} {...api.getColumnProps(column)}>
          <header {...api.columnHeaderProps}>
            <div {...api.getColumnTitleProps(column)}>{column.title}</div>
            <span {...api.getColumnCountProps(column)}>{api.countText(column)}</span>
          </header>
          <div {...api.getListProps(column)}>
            {inColumn.map((card) => (
              <div key={card.id} {...api.getCardProps(card)}>
                <div {...api.getCardTitleProps(card)}>{card.title}</div>
                <div {...api.getCardBodyProps(card)}>{children?.(card)}</div>
                <button {...api.getCardMenuProps(card)}>
                  <span {...api.cardMenuIconProps} />
                </button>
              </div>
            ))}
            {adds.map((add) => (
              <div key={`add-${add.id}`} {...api.getPendingCardProps(add)}>
                {add.title}
              </div>
            ))}
          </div>
          {inColumn.length === 0 && adds.length === 0 && api.adding !== column.id && <p {...api.emptyProps}>{api.words.empty}</p>}
          {onAdd &&
            (api.adding === column.id ? (
              <div {...api.getAddFormProps(column)}>
                <textarea {...api.getAddInputProps(column)} />
                <div {...api.addActionsProps}>
                  <button {...api.addSubmitProps}>{api.words.addSubmit}</button>
                  <button {...api.addCancelProps}>{api.words.addCancel}</button>
                </div>
              </div>
            ) : (
              <button {...api.getAddTriggerProps(column)}>
                <span {...api.addTriggerIconProps} />
                {api.words.addCard}
              </button>
            ))}
        </section>
      ))}
      <div {...api.liveProps}>{api.announcement}</div>
      <div {...api.instructionsProps}>{api.words.instructions}</div>
      <MenuContent
        api={menuApi}
        getState={menu.getState}
        reference={() => (menuCard.current ? document.getElementById(api.ids.card(menuCard.current)) : null)}
        anchor={() => menuAnchor.current}
        dismissOnReference
      />
    </div>
  )
}
