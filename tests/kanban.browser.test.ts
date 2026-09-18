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
