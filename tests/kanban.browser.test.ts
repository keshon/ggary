import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import '../packages/theme-ggarry/src/index.css'
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Kanban } from '../packages/react/src/index'
import { columns, tasks } from './conformance/board'

/**
 * The board where only a browser can say: real keys carrying a card along a
 * board narrower than its columns, the board scrolling to keep it in sight,
 * Tab leaving with a card up, and the card held drawn above the rest.
 */

let root: Root | null = null
afterEach(() => {
  root?.unmount()
  root = null
  document.body.replaceChildren()
})

const frames = (count = 2) =>
  new Promise<void>((resolve) => {
    let left = count
    const tick = () => (--left <= 0 ? resolve() : requestAnimationFrame(tick))
    requestAnimationFrame(tick)
  })

async function mount(props: Record<string, unknown> = {}) {
  const host = document.createElement('div')
  host.style.cssText = 'inline-size: 420px'
  const after = document.createElement('button')
  after.textContent = 'After'
  document.body.append(host, after)
  root = createRoot(host)
  root.render(createElement(Kanban, { columns, cards: tasks, ...props }))
  await frames(2)
  const board = host.querySelector<HTMLElement>('[data-part="root"]')!
  const card = (id: string) => host.querySelector<HTMLElement>(`[data-card="${id}"]`)!
  return { host, board, card, after }
}

describe('kanban', () => {
  it('real keys carry a card across a board narrower than its columns, the board scrolling to keep it in sight', async () => {
    const { board, card } = await mount()
    expect(board.scrollWidth).toBeGreaterThan(board.clientWidth)
    card('a').focus()
    await userEvent.keyboard(' {ArrowRight}{ArrowRight}{ArrowRight}')
    await frames(2)
    expect(document.activeElement).toBe(card('a'))
    expect(card('a').closest('[data-column]')!.getAttribute('data-column')).toBe('done')
    const box = board.getBoundingClientRect()
    const held = card('a').getBoundingClientRect()
    expect(held.left).toBeGreaterThanOrEqual(box.left - 1)
    expect(held.right).toBeLessThanOrEqual(box.right + 1)
    expect(getComputedStyle(card('a')).boxShadow).not.toBe('none')
    await userEvent.keyboard(' ')
    expect(card('a').hasAttribute('data-lifted')).toBe(false)
  })

  it('Tab out with a card up puts it back and lets the focus go on', async () => {
    const { card, after } = await mount()
    card('b').focus()
    await userEvent.keyboard(' {ArrowRight}')
    expect(card('b').closest('[data-column]')!.getAttribute('data-column')).toBe('doing')
    await userEvent.keyboard('{Tab}')
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(document.activeElement).toBe(after)
    expect(card('b').closest('[data-column]')!.getAttribute('data-column')).toBe('todo')
    expect(card('b').hasAttribute('data-lifted')).toBe(false)
  })

  it('a press on a control inside a card is the control’s, not the card’s', async () => {
    const opened: string[] = []
    const { card } = await mount({ onOpen: (item: { id: string }) => opened.push(item.id), children: () => createElement('button', { type: 'button' }, 'Assign') })
    await userEvent.click(card('c').querySelector('button')!)
    expect(opened).toEqual([])
    await userEvent.click(card('c').querySelector('[data-part="card-title"]')!)
    expect(opened).toEqual(['c'])
  })
})

describe('kanban by pointer', () => {
  const pointer = (type: string, x: number, y: number, pointerType = 'mouse') => {
    const target = document.elementFromPoint(x, y) ?? document.body
    target.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: 7, pointerType, isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, bubbles: true, cancelable: true, composed: true }))
  }
  const middle = (element: Element) => {
    const box = element.getBoundingClientRect()
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
  }
  const columnOf = (card: Element) => card.closest('[data-column]')!.getAttribute('data-column')

  it('a real mouse drags a card into an empty column; the owner hears the move and the card does not open', async () => {
    const moves: unknown[] = []
    const opened: string[] = []
    const { host, card } = await mount({ onMove: (move: { card: { id: string }; to: unknown }) => void moves.push([move.card.id, move.to]), onOpen: (item: { id: string }) => opened.push(item.id) })
    host.style.inlineSize = '1200px'
    await frames(2)
    const review = host.querySelector('[data-column="review"] [data-part="empty"]')!
    await userEvent.dragAndDrop(card('a'), review)
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(columnOf(card('a'))).toBe('review')
    expect(moves).toEqual([['a', { column: 'review', index: 0 }]])
    expect(opened).toEqual([])
    expect(host.querySelector('[data-drag-overlay]')).toBeNull()
    expect(card('a').style.visibility).toBe('')
  })

  it('a press that moves less than a few pixels is a press: it opens the card', async () => {
    const opened: string[] = []
    const { card } = await mount({ onOpen: (item: { id: string }) => opened.push(item.id) })
    await userEvent.click(card('b'))
    expect(opened).toEqual(['b'])
    expect(card('b').hasAttribute('data-dragging')).toBe(false)
  })

  it('while dragged, the card in the list is the place it would land and a copy follows the pointer; Escape puts it back', async () => {
    const { host, board, card } = await mount()
    host.style.inlineSize = '1200px'
    await frames(2)
    const from = middle(card('b'))
    pointer('pointerdown', from.x, from.y)
    pointer('pointermove', from.x + 2, from.y + 1)
    expect(host.querySelector('[data-drag-overlay]')).toBeNull()
    const between = card('e').getBoundingClientRect()
    const to = { x: between.left + 40, y: between.top + 4 }
    pointer('pointermove', to.x, to.y)
    await frames(2)
    expect(board.hasAttribute('data-dragging')).toBe(true)
    expect(columnOf(card('b'))).toBe('doing')
    const titles = [...host.querySelectorAll('[data-column="doing"] [data-part="card-title"]')].map((title) => title.textContent)
    expect(titles.slice(0, 3)).toEqual(['Fix the import', 'Send the offer', 'Write the contract'])
    expect(card('b').hasAttribute('data-dragging')).toBe(true)
    const overlay = host.querySelector<HTMLElement>('[data-drag-overlay]')!
    expect(overlay.getAttribute('aria-hidden')).toBe('true')
    expect(overlay.querySelector('[id]')).toBeNull()
    const drawn = overlay.getBoundingClientRect()
    expect(Math.abs(drawn.left + (from.x - card('b').getBoundingClientRect().left) - to.x)).toBeLessThan(40)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(columnOf(card('b'))).toBe('todo')
    expect(board.hasAttribute('data-dragging')).toBe(false)
    expect(host.querySelector('[data-drag-overlay]')).toBeNull()
    pointer('pointerup', to.x, to.y)
  })

  it('held at the board’s edge, the board scrolls toward it', async () => {
    const { board, card } = await mount()
    expect(board.scrollLeft).toBe(0)
    const from = middle(card('a'))
    pointer('pointerdown', from.x, from.y)
    const edge = board.getBoundingClientRect().right - 8
    pointer('pointermove', edge, from.y)
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(board.scrollLeft).toBeGreaterThan(40)
    pointer('pointerup', edge, from.y)
    await new Promise((resolve) => setTimeout(resolve, 250))
  })

  it('a finger that moves at once scrolls; a finger held still picks the card up', async () => {
    const { host, card } = await mount()
    const from = middle(card('a'))
    pointer('pointerdown', from.x, from.y, 'touch')
    pointer('pointermove', from.x, from.y + 20, 'touch')
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(host.querySelector('[data-drag-overlay]')).toBeNull()
    pointer('pointerup', from.x, from.y + 20, 'touch')
    pointer('pointerdown', from.x, from.y, 'touch')
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(host.querySelector('[data-drag-overlay]')).not.toBeNull()
    expect(card('a').hasAttribute('data-dragging')).toBe(true)
    pointer('pointercancel', from.x, from.y, 'touch')
    await new Promise((resolve) => setTimeout(resolve, 250))
    expect(card('a').hasAttribute('data-dragging')).toBe(false)
  })
})
