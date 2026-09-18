<script lang="ts" generics="T extends KanbanCard">
  import { connect, createKanbanMachine, focusKanbanCard, type KanbanCard, type KanbanColumn, type KanbanMove, type KanbanWords } from '@ggary/core/kanban'
  import { svelteNormalizer, uid } from '@ggary/core'
  import { untrack, type Snippet } from 'svelte'

  type Props = {
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
    /** What a card shows under its title. */
    card?: Snippet<[T]>
    /** The heading level of each column's title. Default 3. */
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
    /** The board's accessible name, and the words it says. */
    words?: Partial<KanbanWords>
  }

  /** Columns of cards, a card moved by the keyboard from one place to another. */
  let { columns, cards, onMove, onOpen, card: body, headingLevel, words }: Props = $props()

  const machine = untrack(() =>
    createKanbanMachine<T>({
      id: uid('gg-kanban'),
      columns,
      cards,
      onMove: (move) => onMove?.(move),
      onOpen: (card) => onOpen?.(card),
    })
  )
  let snapshot = $state.raw(machine.getState())
  $effect(() => machine.subscribe((next) => (snapshot = next)))
  const api = $derived(connect(snapshot, machine.send, svelteNormalizer, words, { headingLevel }))

  $effect(() => machine.send({ type: 'SYNC_COLUMNS', columns }))
  $effect(() => machine.send({ type: 'SYNC_CARDS', cards }))

  // A move re-renders the card in its new place: the focus goes with it.
  let lastFocusNonce = 0
  $effect(() => {
    const { focusNonce, focusCard } = api
    if (focusNonce === 0 || focusNonce === lastFocusNonce || focusCard === null) return
    lastFocusNonce = focusNonce
    untrack(() => focusKanbanCard(document, api.ids.card(focusCard)))
  })
</script>

<div {...api.rootProps}>
  {#each api.columns as { column, cards: inColumn } (column.id)}
    <section {...api.getColumnProps(column)}>
      <header {...api.columnHeaderProps}>
        <div {...api.getColumnTitleProps(column)}>{column.title}</div>
        <span {...api.getColumnCountProps(column)}>{api.countText(column)}</span>
      </header>
      <div {...api.getListProps(column)}>
        {#each inColumn as item (item.id)}
          <div {...api.getCardProps(item)}>
            <div {...api.getCardTitleProps(item)}>{item.title}</div>
            <div {...api.getCardBodyProps(item)}>{#if body}{@render body(item)}{/if}</div>
          </div>
        {/each}
      </div>
      {#if inColumn.length === 0}<p {...api.emptyProps}>{api.words.empty}</p>{/if}
    </section>
  {/each}
  <div {...api.liveProps}>{api.announcement}</div>
  <div {...api.instructionsProps}>{api.words.instructions}</div>
</div>
