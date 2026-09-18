import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { attachKanbanDrag, connect, createKanbanMachine, focusKanbanCard, type KanbanCard, type KanbanColumn, type KanbanMove, type KanbanWords } from '@ggary/core/kanban'
import { reactNormalizer } from '@ggary/core'

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
  /** Whether a card may be dragged by a pointer. Default: all of them. The keyboard can still move it. */
  canDrag?: (card: T) => boolean
  /** What a card shows under its title. */
  children?: (card: T) => ReactNode
  /** The heading level of each column's title. Default 3. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
  /** The board's accessible name, and the words it says. */
  words?: Partial<KanbanWords>
}

/** Columns of cards, a card moved by the keyboard from one place to another. */
export function Kanban<T extends KanbanCard>(props: KanbanProps<T>) {
  const { columns, cards, onMove, onOpen, canDrag, children, headingLevel, words } = props
  const id = `gg-kanban-${useId().replace(/:/g, '')}`
  const callbacks = useRef({ onMove, onOpen, canDrag })
  callbacks.current = { onMove, onOpen, canDrag }
  const [machine] = useState(() =>
    createKanbanMachine<T>({
      id,
      columns,
      cards,
      onMove: (move) => callbacks.current.onMove?.(move),
      onOpen: (card) => callbacks.current.onOpen?.(card),
    })
  )
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const api = connect(state, machine.send, reactNormalizer, words, { headingLevel })

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

  return (
    <div ref={rootRef} {...api.rootProps}>
      {api.columns.map(({ column, cards: inColumn }) => (
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
              </div>
            ))}
          </div>
          {inColumn.length === 0 && <p {...api.emptyProps}>{api.words.empty}</p>}
        </section>
      ))}
      <div {...api.liveProps}>{api.announcement}</div>
      <div {...api.instructionsProps}>{api.words.instructions}</div>
    </div>
  )
}
