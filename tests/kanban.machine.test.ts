import { describe, expect, it } from 'vitest'
import { applyMove, connect, createKanbanMachine, orderOf, tabStop, type KanbanMove } from '../packages/core/src/components/kanban'
import { columns, tasks, type Task } from './conformance/board'

/**
 * The board with no DOM: the focus walking the cards, a card picked up,
 * carried and dropped or put back, the move shown at once and taken back
 * when the owner refuses it, and what is said at each step.
 */

const same = (props: Record<string, unknown>) => props
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

const board = (onMove?: (move: KanbanMove<Task>) => unknown) => {
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
