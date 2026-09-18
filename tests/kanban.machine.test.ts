import { describe, expect, it } from 'vitest'
import { applyMove, cardMenuItems, cardMenuPlace, connect, createKanbanMachine, KANBAN_MENU, orderOf, tabStop, type KanbanMove } from '../packages/core/src/components/kanban'
import { columns, tasks, type Task } from './conformance/board'

/**
 * The board with no DOM: the focus walking the cards, a card picked up,
 * carried and dropped or put back, the move shown at once and taken back
 * when the owner refuses it, and what is said at each step.
 */

const same = (props: Record<string, unknown>) => props
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

const board = (onMove?: (move: KanbanMove<Task>) => unknown, onAdd?: (column: string, title: string) => unknown) => {
  const moves: KanbanMove<Task>[] = []
  const opened: string[] = []
  const machine = createKanbanMachine<Task>({
    id: 'k',
    columns,
    cards: tasks,
    onMove: (move) => {
      moves.push(move)
      return onMove?.(move)
    },
    onOpen: (card) => opened.push(card.id),
    onAdd,
  })
  const order = () => machine.getState().order
  const focused = () => tabStop(machine.getState())
  const said = () => connect(machine.getState(), machine.send, same).announcement
  return { machine, send: machine.send, moves, opened, order, focused, said }
}

describe('kanban', () => {
  it('orders each column as the cards are given, and applies a move to the cards the same way', () => {
    expect(orderOf(columns, tasks)).toEqual({ todo: ['a', 'b', 'c'], doing: ['d', 'e'], review: [], done: ['f'] })
    const moved = applyMove(tasks, { card: { id: 'a' }, to: { column: 'doing', index: 1 } })
    expect(orderOf(columns, moved)).toEqual({ todo: ['b', 'c'], doing: ['d', 'a', 'e'], review: [], done: ['f'] })
    const last = applyMove(tasks, { card: { id: 'd' }, to: { column: 'review', index: 0 } })
    expect(orderOf(columns, last).review).toEqual(['d'])
  })

  it('the arrows walk the cards, across columns passing an empty one, keeping the row as near as it can', () => {
    const { send, focused } = board()
    expect(focused()).toBe('a')
    send({ type: 'WALK', direction: 'down' })
    send({ type: 'WALK', direction: 'down' })
    expect(focused()).toBe('c')
    send({ type: 'WALK', direction: 'right' })
    expect(focused()).toBe('e')
    send({ type: 'WALK', direction: 'right' })
    expect(focused()).toBe('f')
    send({ type: 'WALK', direction: 'right' })
    expect(focused()).toBe('f')
    send({ type: 'WALK', direction: 'left' })
    send({ type: 'WALK', direction: 'first' })
    expect(focused()).toBe('d')
  })

  it('Space picks a card up; the arrows carry it, into an empty column too, saying where it is', () => {
    const { send, order, said } = board()
    send({ type: 'LIFT' })
    expect(said()).toBe('Picked up Call Aigul. To do, 1 of 3.')
    send({ type: 'SHIFT', direction: 'down' })
    expect(order().todo).toEqual(['b', 'a', 'c'])
    expect(said()).toBe('To do, 2 of 3.')
    send({ type: 'SHIFT', direction: 'right' })
    expect(order().doing).toEqual(['d', 'a', 'e'])
    expect(said()).toBe('Doing, 2 of 3.')
    send({ type: 'SHIFT', direction: 'right' })
    expect(order().review).toEqual(['a'])
    expect(said()).toBe('Review, 1 of 1.')
  })

  it('a drop hands the move to the owner; Escape puts the card back and moves nothing', async () => {
    const { send, order, said, moves } = board()
    send({ type: 'LIFT' })
    send({ type: 'SHIFT', direction: 'right' })
    send({ type: 'SHIFT', direction: 'last' })
    send({ type: 'DROP' })
    expect(said()).toBe('Dropped Call Aigul in Doing, 3 of 3.')
    await tick()
    expect(moves.map(({ card, from, to }) => [card.id, from, to])).toEqual([['a', { column: 'todo', index: 0 }, { column: 'doing', index: 2 }]])

    send({ type: 'FOCUS', card: 'b' })
    send({ type: 'LIFT' })
    send({ type: 'SHIFT', direction: 'right' })
    send({ type: 'CANCEL' })
    expect(order().todo).toEqual(['b', 'c'])
    expect(said()).toBe('Send the offer put back in To do, 1 of 2.')
    await tick()
    expect(moves).toHaveLength(1)
  })

  it('a card dropped where it was picked up is no move', async () => {
    const { send, moves } = board()
    send({ type: 'LIFT' })
    send({ type: 'SHIFT', direction: 'down' })
    send({ type: 'SHIFT', direction: 'up' })
    send({ type: 'DROP' })
    await tick()
    expect(moves).toEqual([])
  })

  it('a refused move puts that card back and says why; the move stands over new cards until answered', async () => {
    let refuse: (error: Error) => void = () => {}
    const { machine, send, order, said } = board(() => new Promise((_, reject) => (refuse = reject)))
    send({ type: 'MOVE', card: 'a', to: { column: 'done', index: 0 } })
    expect(order().done).toEqual(['a', 'f'])
    expect(machine.getState().pending).toHaveLength(1)
    // The owner's cards change meanwhile, without the move: it still stands.
    send({ type: 'SYNC_CARDS', cards: [...tasks, { id: 'g', column: 'review', title: 'New lead' }] })
    expect(order().done).toEqual(['a', 'f'])
    expect(order().review).toEqual(['g'])
    await tick()
    refuse(new Error('the deal has no amount'))
    await tick()
    await tick()
    expect(order().todo).toEqual(['a', 'b', 'c'])
    expect(said()).toBe('Call Aigul was not moved: the deal has no amount')
  })

  it('an answer to a move overtaken by another of the same card says nothing', async () => {
    const answers: ((ok: boolean) => void)[] = []
    const { send, order } = board(() => new Promise((resolve, reject) => answers.push((ok) => (ok ? resolve(undefined) : reject(new Error('no'))))))
    send({ type: 'MOVE', card: 'a', to: { column: 'review', index: 0 } })
    send({ type: 'MOVE', card: 'a', to: { column: 'done', index: 0 } })
    await tick()
    answers[0](false)
    await tick()
    await tick()
    expect(order().done[0]).toBe('a')
  })

  it('leaving the board with a card up puts it back without pulling the focus in', () => {
    const { machine, send, order } = board()
    send({ type: 'LIFT' })
    send({ type: 'SHIFT', direction: 'right' })
    const nonce = machine.getState().focus.nonce
    send({ type: 'BLUR' })
    expect(order().todo[0]).toBe('a')
    expect(machine.getState().focus.nonce).toBe(nonce)
  })

  it('a pointer drag: the card is shown where it is over, a blur is no leaving, the drop hands the move over', async () => {
    const { machine, send, order, moves } = board()
    send({ type: 'LIFT', card: 'b', by: 'pointer' })
    expect(machine.getState().lifted).toMatchObject({ card: 'b', by: 'pointer', origin: { column: 'todo', index: 1 } })
    send({ type: 'PLACE', to: { column: 'review', index: 0 } })
    expect(order().review).toEqual(['b'])
    // The card's element is re-rendered in its new place, and the focus goes for a moment.
    send({ type: 'BLUR' })
    expect(machine.getState().lifted).not.toBeNull()
    send({ type: 'PLACE', to: { column: 'review', index: 5 } })
    expect(order().review).toEqual(['b'])
    const nonce = machine.getState().focus.nonce
    send({ type: 'DROP' })
    expect(machine.getState().focus).toEqual({ card: 'b', nonce: nonce + 1 })
    await tick()
    expect(moves.map(({ card, to }) => [card.id, to])).toEqual([['b', { column: 'review', index: 0 }]])
  })

  it('a drag cancelled puts the card back; PLACE without a card up does nothing', () => {
    const { send, order } = board()
    send({ type: 'PLACE', to: { column: 'done', index: 0 } })
    expect(order().done).toEqual(['f'])
    send({ type: 'LIFT', card: 'd', by: 'pointer' })
    send({ type: 'PLACE', to: { column: 'done', index: 1 } })
    send({ type: 'CANCEL' })
    expect(order()).toEqual({ todo: ['a', 'b', 'c'], doing: ['d', 'e'], review: [], done: ['f'] })
  })

  it('a card’s menu: move to each other column, to the top or bottom of its own, then yours', () => {
    const { machine } = board()
    const items = cardMenuItems(machine.getState(), 'b', {}, [{ value: 'archive', label: 'Archive' }])
    expect(items[0]).toMatchObject({ type: 'submenu', label: 'Move to', items: [{ label: 'Doing' }, { label: 'Review' }, { label: 'Done' }] })
    expect(items.slice(1).map((item) => ('label' in item ? item.label : item.type))).toEqual(['Move to top', 'Move to bottom', 'separator', 'Archive'])
    const top = cardMenuItems(machine.getState(), 'a')
    expect(top[1]).toMatchObject({ disabled: true })
    expect(cardMenuPlace(machine.getState(), 'b', `${KANBAN_MENU.moveTo}done`)).toEqual({ column: 'done', index: 1 })
    expect(cardMenuPlace(machine.getState(), 'b', KANBAN_MENU.top)).toEqual({ column: 'todo', index: 0 })
    expect(cardMenuPlace(machine.getState(), 'b', 'archive')).toBeNull()
  })

  it('a move from the menu says where the card went', () => {
    const { send, said } = board()
    send({ type: 'MOVE', card: 'b', to: { column: 'done', index: 1 } })
    expect(said()).toBe('Send the offer moved to Done, 2 of 2.')
  })

  it('a right click, Shift+F10 or the menu button asks for a card’s menu; not while one is carried', () => {
    const { machine, send } = board()
    send({ type: 'MENU', card: 'c', point: { x: 10, y: 20 }, via: 'pointer' })
    expect(machine.getState().menu).toEqual({ card: 'c', point: { x: 10, y: 20 }, via: 'pointer', nonce: 1 })
    send({ type: 'LIFT' })
    send({ type: 'MENU', card: 'a', via: 'keyboard' })
    expect(machine.getState().menu.nonce).toBe(1)
  })

  it('a card typed in stands faded at its column’s end until the owner answers, and the field stays open for the next', async () => {
    let answer: (ok: boolean) => void = () => {}
    const added: string[][] = []
    const { machine, send, said } = board(undefined, (column, title) => {
      added.push([column, title])
      return new Promise((resolve, reject) => (answer = (ok) => (ok ? resolve(undefined) : reject(new Error('the board is full')))))
    })
    send({ type: 'ADD_OPEN', column: 'review' })
    send({ type: 'ADD_DRAFT', text: '  Ask for feedback ' })
    send({ type: 'ADD_SUBMIT' })
    expect(machine.getState().adding).toEqual({ column: 'review', draft: '' })
    expect(machine.getState().adds.map((add) => [add.column, add.title])).toEqual([['review', 'Ask for feedback']])
    await tick()
    expect(added).toEqual([['review', 'Ask for feedback']])
    // The answer comes before the owner's new cards: the stand-in waits for them.
    answer(true)
    await tick()
    await tick()
    expect(said()).toBe('Added Ask for feedback to Review.')
    expect(machine.getState().adds).toHaveLength(1)
    send({ type: 'SYNC_CARDS', cards: [...tasks, { id: 'n', column: 'review', title: 'Ask for feedback' }] })
    expect(machine.getState().adds).toEqual([])
  })

  it('a refused card goes, and its title comes back to the empty field', async () => {
    const { machine, send, said } = board(undefined, () => Promise.reject(new Error('the board is full')))
    send({ type: 'ADD_OPEN', column: 'todo' })
    send({ type: 'ADD_DRAFT', text: 'Call back' })
    send({ type: 'ADD_SUBMIT' })
    await tick()
    await tick()
    await tick()
    expect(machine.getState().adds).toEqual([])
    expect(machine.getState().adding).toEqual({ column: 'todo', draft: 'Call back' })
    expect(said()).toBe('Call back was not added: the board is full')
  })

  it('an empty title is not sent; Escape closes the field and gives the focus back to its button', () => {
    const { machine, send } = board()
    send({ type: 'ADD_OPEN', column: 'todo' })
    send({ type: 'ADD_DRAFT', text: '   ' })
    send({ type: 'ADD_SUBMIT' })
    expect(machine.getState().adds).toEqual([])
    send({ type: 'ADD_CLOSE', refocus: true })
    expect(machine.getState().adding).toBeNull()
    expect(machine.getState().addFocus).toMatchObject({ column: 'todo', target: 'trigger' })
  })

  it('Enter opens a card; it does not while one is carried', () => {
    const { send, opened } = board()
    send({ type: 'OPEN' })
    send({ type: 'LIFT' })
    send({ type: 'OPEN' })
    expect(opened).toEqual(['a'])
  })

  it('says its parts: one tab stop, cards named by their title, a count against a limit', () => {
    const { machine } = board()
    const api = connect(machine.getState(), machine.send, same, { label: 'Deals' })
    expect(api.rootProps).toMatchObject({ role: 'group', 'aria-label': 'Deals' })
    const cards = api.columns.flatMap(({ cards }) => cards.map((card) => api.getCardProps(card) as Record<string, unknown>))
    expect(cards.filter((props) => props.tabIndex === 0)).toHaveLength(1)
    expect(cards[0]).toMatchObject({ role: 'listitem', 'aria-roledescription': 'card', 'aria-labelledby': api.ids.cardTitle('a') })
    const doing = columns[1]
    expect(api.countText(doing)).toBe('2 / 2')
    expect(api.getColumnProps(doing)).toMatchObject({ 'data-over': undefined })
    expect(api.getListProps(doing)).toMatchObject({ role: 'list', 'aria-labelledby': api.ids.columnTitle('doing') })
    machine.send({ type: 'MOVE', card: 'a', to: { column: 'doing', index: 0 } })
    const after = connect(machine.getState(), machine.send, same)
    expect(after.getColumnProps(doing)).toMatchObject({ 'data-over': '' })
    expect(after.getCardProps(tasks[0])).toMatchObject({ 'data-pending': '' })
  })
})
