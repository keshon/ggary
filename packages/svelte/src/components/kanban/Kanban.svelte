<script lang="ts" generics="T extends KanbanCard">
  import { getConfig } from '../config-provider/context'
  import { configWords } from '@ggary/core/config-provider'
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
  import { svelteNormalizer, uid, type VirtualElement } from '@ggary/core'
  import { untrack, type Snippet } from 'svelte'
  import MenuContent from '../menu/MenuContent.svelte'

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
    card?: Snippet<[T]>
    /** The heading level of each column's title. Default 3. */
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
    /** The board's accessible name, and the words it says. */
    words?: Partial<KanbanWords>
  }

  /** Columns of cards, a card moved by the keyboard, a pointer or its menu. */
  let { columns, cards, onMove, onOpen, onAdd, cardMenu, onCardMenuSelect, canDrag, card: body, headingLevel, words: ownWords }: Props = $props()
  const kit = getConfig()
  const words = $derived(configWords(kit(), 'kanban', ownWords))

  const id = uid('gg-kanban')
  const machine = untrack(() =>
    createKanbanMachine<T>({
      id,
      columns,
      cards,
      onMove: (move) => onMove?.(move),
      onOpen: (card) => onOpen?.(card),
      onAdd: (column, title) => onAdd?.(column, title),
    })
  )
  let snapshot = $state.raw(machine.getState())
  $effect(() => machine.subscribe((next) => (snapshot = next)))
  const api = $derived(connect(snapshot, machine.send, svelteNormalizer, { words, headingLevel }))

  $effect(() => machine.send({ type: 'SYNC_COLUMNS', columns }))
  $effect(() => machine.send({ type: 'SYNC_CARDS', cards }))

  let rootEl = $state<HTMLDivElement | null>(null)
  $effect(() => {
    if (!rootEl) return
    const root = rootEl
    return untrack(() =>
      attachKanbanDrag(root, machine.send, {
        canDrag: (key) => {
          const card = machine.getState().cards.find((candidate) => candidate.id === key)
          return !!card && (canDrag?.(card) ?? true)
        },
      })
    )
  })

  // A move re-renders the card in its new place: the focus goes with it.
  let lastFocusNonce = 0
  $effect(() => {
    const { focusNonce, focusCard } = api
    if (focusNonce === 0 || focusNonce === lastFocusNonce || focusCard === null) return
    lastFocusNonce = focusNonce
    untrack(() => focusKanbanCard(document, api.ids.card(focusCard)))
  })
  let lastAddFocus = 0
  $effect(() => {
    const { addFocusNonce, addFocusId } = api
    if (addFocusNonce === 0 || addFocusNonce === lastAddFocus || !addFocusId) return
    lastAddFocus = addFocusNonce
    untrack(() => document.getElementById(addFocusId)?.focus())
  })

  // One menu for the board, opened for a card: at the pointer, under its button, or under the card.
  let menuCard: string | null = null
  let menuAnchor: Element | VirtualElement | null = null
  const menu = createMenuMachine({
    id: `${id}-menu`,
    items: [],
    onSelect: (value) => {
      const key = menuCard
      if (!key) return
      const place = cardMenuPlace(machine.getState(), key, value)
      if (place) {
        const move = () => machine.send({ type: 'MOVE', card: key, to: place })
        if (rootEl) flipKanban(rootEl, move)
        else move()
        return
      }
      const card = machine.getState().cards.find((candidate) => candidate.id === key)
      if (card) onCardMenuSelect?.(value, card)
    },
  })
  let menuState = $state.raw(menu.getState())
  $effect(() => menu.subscribe(() => (menuState = menu.getState())))
  const menuTitle = $derived(snapshot.cards.find((card) => card.id === snapshot.menu.card)?.title ?? '')
  const menuApi = $derived(connectMenu(menuState, menu.send, svelteNormalizer, { label: api.words.menu(menuTitle) }))

  let lastMenuNonce = 0
  $effect(() => {
    const request = snapshot.menu
    if (!request.nonce || request.nonce === lastMenuNonce || !request.card) return
    lastMenuNonce = request.nonce
    untrack(() => {
      const key = request.card!
      const card = machine.getState().cards.find((candidate) => candidate.id === key)
      if (!card) return
      menuCard = key
      const element = document.getElementById(api.ids.card(key))
      const point = request.point
      menuAnchor = point
        ? { getBoundingClientRect: () => new DOMRect(point.x, point.y, 0, 0), contextElement: element ?? undefined }
        : request.via === 'button'
          ? document.getElementById(api.ids.cardMenu(key))
          : element
      menu.send({ type: 'SYNC_ITEMS', items: cardMenuItems(machine.getState(), key, words, cardMenu?.(card) ?? []) })
      // The keyboard lands on the first item; a pointer, on the menu itself.
      menu.send({ type: 'OPEN', reason: 'api', focus: request.via === 'pointer' ? 'none' : 'first' })
    })
  })
</script>

<div bind:this={rootEl} {...api.rootProps}>
  {#each api.columns as { column, cards: inColumn, adds } (column.id)}
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
            <button {...api.getCardMenuProps(item)}><span {...api.cardMenuIconProps}></span></button>
          </div>
        {/each}
        {#each adds as add (add.id)}
          <div {...api.getPendingCardProps(add)}>{add.title}</div>
        {/each}
      </div>
      {#if inColumn.length === 0 && adds.length === 0 && api.adding !== column.id}<p {...api.emptyProps}>{api.words.empty}</p>{/if}
      {#if onAdd}
        {#if api.adding === column.id}
          <div {...api.getAddFormProps(column)}>
            <textarea {...api.getAddInputProps(column)}></textarea>
            <div {...api.addActionsProps}>
              <button {...api.addSubmitProps}>{api.words.addSubmit}</button>
              <button {...api.addCancelProps}>{api.words.addCancel}</button>
            </div>
          </div>
        {:else}
          <button {...api.getAddTriggerProps(column)}><span {...api.addTriggerIconProps}></span>{api.words.addCard}</button>
        {/if}
      {/if}
    </section>
  {/each}
  <div {...api.liveProps}>{api.announcement}</div>
  <div {...api.instructionsProps}>{api.words.instructions}</div>
  <MenuContent
    api={menuApi}
    getState={menu.getState}
    reference={() => (menuCard ? document.getElementById(api.ids.card(menuCard)) : null)}
    anchor={() => menuAnchor}
    dismissOnReference
  />
</div>
