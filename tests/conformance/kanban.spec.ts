import { describe, expect, it } from 'vitest'
import { type Adapter, type KanbanProps, click, freshTarget, keydown, part, parts, typeInto } from './harness'
import { columns, tasks } from './board'
import type { KanbanMove } from '../../packages/core/src/components/kanban'

/**
 * The board in each framework: its columns and cards named, one tab stop,
 * a card walked to, picked up, carried and dropped with the real focus
 * following it across re-renders, and what the live region says.
 */
export function kanbanConformance(adapter: Adapter) {
  const run = adapter.kanban ? describe : describe.skip
  run('kanban', () => {
    const setup = async (props: Partial<KanbanProps> = {}) => {
      const moves: KanbanMove[] = []
      const opened: string[] = []
      const m = await adapter.kanban!({ columns, cards: tasks, onMove: (move) => void moves.push(move), onOpen: (card) => void opened.push(card.id), ...props }, freshTarget())
      const card = (id: string) => m.root.querySelector<HTMLElement>(`[data-part="card"][data-card="${id}"]`)!
      const column = (id: string) => parts(m.root, 'kanban', 'list').find((list) => list.dataset.column === id)!
      const titles = (id: string) => parts(column(id), 'kanban', 'card-title').map((title) => title.textContent)
      const live = () => part(m.root, 'kanban', 'live')!.textContent
      const press = (key: string) => adapter.act(() => void keydown(document.activeElement!, key))
      return { m, card, column, titles, live, press, moves, opened }
    }

    it('names its columns and cards; one card is the tab stop', async () => {
      const { m, card, column } = await setup()
      const root = part(m.root, 'kanban', 'root') ?? m.root
      expect(root.getAttribute('role')).toBe('group')
      expect(root.getAttribute('aria-label')).toBe('Board')
      const doing = column('doing')
      expect(doing.getAttribute('role')).toBe('list')
      expect(doing.getAttribute('tabindex')).toBe('-1')
      expect(document.getElementById(doing.getAttribute('aria-labelledby')!)!.textContent).toBe('Doing')
      const first = card('a')
      expect(first.getAttribute('role')).toBe('listitem')
      expect(document.getElementById(first.getAttribute('aria-labelledby')!)!.textContent).toBe('Call Aigul')
      expect(first.getAttribute('aria-describedby')!.split(' ').map((id) => document.getElementById(id) !== null)).toEqual([true, true])
      expect(parts(m.root, 'kanban', 'card').filter((element) => element.tabIndex === 0)).toEqual([first])
      expect(parts(m.root, 'kanban', 'column-count').map((count) => count.textContent)).toEqual(['3', '2 / 2', '0', '1'])
      expect(part(m.root, 'kanban', 'empty')!.textContent).toBe('No cards')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('the arrows walk the cards with the real focus', async () => {
      const { card, press } = await setup()
      card('a').focus()
      await adapter.act(() => {})
      await press('ArrowDown')
      expect(document.activeElement).toBe(card('b'))
      await press('ArrowRight')
      expect(document.activeElement).toBe(card('e'))
      await press('ArrowRight')
      expect(document.activeElement).toBe(card('f'))
      expect(card('f').tabIndex).toBe(0)
      expect(card('a').tabIndex).toBe(-1)
    })

    it('Space picks a card up, the arrows carry it with the focus, Space drops it and the owner hears', async () => {
      const { card, titles, live, press, moves } = await setup()
      card('a').focus()
      await adapter.act(() => {})
      await press(' ')
      expect(card('a').hasAttribute('data-lifted')).toBe(true)
      expect(live()).toBe('Picked up Call Aigul. To do, 1 of 3.')
      await press('ArrowRight')
      await press('ArrowDown')
      expect(titles('doing')).toEqual(['Fix the import', 'Call Aigul', 'Write the contract'])
      expect(document.activeElement).toBe(card('a'))
      expect(live()).toBe('Doing, 2 of 3.')
      await press(' ')
      await adapter.wait(0)
      expect(card('a').hasAttribute('data-lifted')).toBe(false)
      expect(moves.map(({ card: moved, to }) => [moved.id, to])).toEqual([['a', { column: 'doing', index: 1 }]])
      expect(live()).toBe('Dropped Call Aigul in Doing, 2 of 3.')
    })

    it('Escape puts a carried card back, with the focus on it', async () => {
      const { card, titles, press, moves } = await setup()
      card('b').focus()
      await adapter.act(() => {})
      await press(' ')
      await press('ArrowRight')
      await press('ArrowRight')
      expect(titles('review')).toEqual(['Send the offer'])
      await press('Escape')
      expect(titles('todo')).toEqual(['Call Aigul', 'Send the offer', 'Book the demo'])
      expect(document.activeElement).toBe(card('b'))
      await adapter.wait(0)
      expect(moves).toEqual([])
    })

    it('a refused move goes back and says why', async () => {
      const { card, titles, live, press } = await setup({ onMove: () => Promise.reject(new Error('the deal has no amount')) })
      card('a').focus()
      await adapter.act(() => {})
      await press(' ')
      await press('ArrowRight')
      await press('Enter')
      await adapter.wait(10)
      expect(titles('todo')).toEqual(['Call Aigul', 'Send the offer', 'Book the demo'])
      expect(live()).toBe('Call Aigul was not moved: the deal has no amount')
    })

    it('a key acts on the card it comes from, even when the board missed that card taking the focus', async () => {
      const { card, live } = await setup()
      // No focus event reaches the board: a window without system focus fires none.
      await adapter.act(() => void keydown(card('c'), ' '))
      expect(card('c').hasAttribute('data-lifted')).toBe(true)
      expect(live()).toBe('Picked up Book the demo. To do, 3 of 3.')
    })

    it('Shift+F10 opens a card’s menu on its first item; Move to bottom moves it, the focus back on it', async () => {
      const { m, card, titles } = await setup()
      card('a').focus()
      await adapter.act(() => {})
      await adapter.act(() => void card('a').dispatchEvent(new KeyboardEvent('keydown', { key: 'F10', shiftKey: true, bubbles: true, cancelable: true })))
      await adapter.wait(0)
      const menu = part(m.root, 'menu', 'content')!
      expect(menu.dataset.state).toBe('open')
      expect(menu.getAttribute('aria-label')).toBe('Actions for Call Aigul')
      const items = parts(menu, 'menu', 'item')
      expect(items.map((item) => part(item, 'menu', 'item-text')!.textContent)).toEqual(['Move to', 'Move to top', 'Move to bottom'])
      expect(part(document.activeElement!, 'menu', 'item-text')?.textContent).toBe('Move to')
      await adapter.act(() => click(items[2]))
      await adapter.wait(0)
      expect(titles('todo')).toEqual(['Send the offer', 'Book the demo', 'Call Aigul'])
      expect(document.activeElement).toBe(card('a'))
    })

    it('a card’s menu button is named for it; a right click opens the menu with your items after the board’s', async () => {
      const chosen: string[] = []
      const { m, card } = await setup({ cardMenu: () => [{ value: 'archive', label: 'Archive' }], onCardMenuSelect: (value, item) => void chosen.push(`${value}:${item.id}`) })
      const button = part(card('c'), 'kanban', 'card-menu')!
      expect(button.getAttribute('aria-label')).toBe('Actions for Book the demo')
      expect(button.getAttribute('aria-haspopup')).toBe('menu')
      expect(button.tabIndex).toBe(-1)
      const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 30, clientY: 40 })
      await adapter.act(() => void card('c').dispatchEvent(event))
      await adapter.wait(0)
      expect(event.defaultPrevented).toBe(true)
      const items = parts(part(m.root, 'menu', 'content')!, 'menu', 'item')
      expect(items.map((item) => part(item, 'menu', 'item-text')!.textContent)).toEqual(['Move to', 'Move to top', 'Move to bottom', 'Archive'])
      await adapter.act(() => click(items[3]))
      await adapter.wait(0)
      expect(chosen).toEqual(['archive:c'])
    })

    it('Add a card: typed and sent with Enter, it stands faded at the column’s end; the field stays open and empty', async () => {
      const added: string[][] = []
      const { m, column } = await setup({ onAdd: (col, title) => new Promise(() => void added.push([col, title])) })
      const trigger = parts(m.root, 'kanban', 'add-trigger').find((button) => button.dataset.column === 'review')!
      expect(trigger.textContent).toBe('Add a card')
      await adapter.act(() => click(trigger))
      await adapter.wait(0)
      const input = part(m.root, 'kanban', 'add-input') as HTMLTextAreaElement
      expect(document.activeElement).toBe(input)
      expect(input.getAttribute('aria-label')).toBe('New card in Review')
      await adapter.act(() => typeInto(input, 'Ask for feedback'))
      await adapter.act(() => void keydown(input, 'Enter'))
      await adapter.wait(0)
      const pending = parts(column('review'), 'kanban', 'pending-card')
      expect(pending.map((element) => [element.textContent, element.getAttribute('aria-busy')])).toEqual([['Ask for feedback', 'true']])
      expect(added).toEqual([['review', 'Ask for feedback']])
      const again = part(m.root, 'kanban', 'add-input') as HTMLTextAreaElement
      expect(again.value).toBe('')
      expect(document.activeElement).toBe(again)
      await adapter.act(() => void keydown(again, 'Escape'))
      await adapter.wait(0)
      expect(part(m.root, 'kanban', 'add-input')).toBeNull()
      expect(document.activeElement).toBe(parts(m.root, 'kanban', 'add-trigger').find((button) => button.dataset.column === 'review'))
    })

    it('Enter or a press opens a card', async () => {
      const { card, press, opened } = await setup()
      card('c').focus()
      await adapter.act(() => {})
      await press('Enter')
      await adapter.act(() => click(card('f')))
      expect(opened).toEqual(['c', 'f'])
    })
  })
}
