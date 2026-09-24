import { afterEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import '../packages/theme-ggarry/src/index.css'
import { createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { List, ListItem } from '../packages/react/src/index'

/**
 * List where only a browser can say: a real press anywhere on a row that goes
 * somewhere lands on it, its own button is still pressed as itself, Tab walks
 * the rows and then their actions, the ring goes round the whole row, and the
 * columns line up whatever a row has.
 */

let root: Root | null = null
afterEach(() => {
  root?.unmount()
  root = null
  document.body.replaceChildren()
})

const frames = (count = 3) =>
  new Promise<void>((resolve) => {
    let left = count
    const tick = () => (--left <= 0 ? resolve() : requestAnimationFrame(tick))
    requestAnimationFrame(tick)
  })

async function mount(onSelect = vi.fn(), onAction = vi.fn(), variant: 'divided' | 'bordered' | 'cards' = 'divided') {
  const host = document.createElement('div')
  host.style.cssText = 'inline-size: 420px; padding: 16px'
  document.body.append(host)
  root = createRoot(host)
  const row = (title: string, meta?: string) =>
    h(ListItem, {
      key: title,
      title,
      description: `${title} — a line long enough to be cut short at the row's end, well before the meta`,
      onSelect: () => onSelect(title),
      leading: h('span', { 'data-icon': 'file', 'aria-hidden': 'true' }),
      meta: meta ? h('span', null, meta) : undefined,
      actions: h('button', { type: 'button', 'aria-label': `More for ${title}`, onClick: () => onAction(title) }, '⋯'),
    })
  root.render(h(List, { label: 'Files', variant }, row('Report', '2h'), row('Brief'), row('Contract', 'yesterday')))
  await frames(3)
  const rows = [...host.querySelectorAll<HTMLElement>('[data-scope="list"][data-part="item"]')]
  return { host, rows, onSelect, onAction }
}

describe('list', () => {
  it('a real press anywhere on the row presses it; its own button is pressed as itself', async () => {
    const { rows, onSelect, onAction } = await mount()
    const target = rows[1].querySelector<HTMLElement>('[data-part="target"]')!
    // What is under the pointer at the line, the icon and the meta's gap is the row's button, stretched over them.
    const under = (part: string) => {
      const box = rows[1].querySelector(`[data-part="${part}"]`)!.getBoundingClientRect()
      return document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
    }
    expect(under('description')).toBe(target)
    expect(under('leading')).toBe(target)
    const row = rows[1].getBoundingClientRect()
    const line = rows[1].querySelector('[data-part="description"]')!.getBoundingClientRect()
    await userEvent.click(target, { position: { x: 4, y: line.top + line.height / 2 - target.getBoundingClientRect().top } })
    expect(onSelect.mock.calls).toEqual([['Brief']])
    expect(row.height).toBeGreaterThan(target.getBoundingClientRect().height)
    await userEvent.click(rows[1].querySelector('[data-part="actions"] button')!)
    expect(onAction).toHaveBeenCalledWith('Brief')
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('Tab walks each row and then its actions, and the ring goes round the whole row', async () => {
    const { rows } = await mount()
    const before = document.createElement('button')
    before.textContent = 'Before'
    document.body.prepend(before)
    before.focus()
    await userEvent.tab()
    const target = rows[0].querySelector<HTMLElement>('[data-part="target"]')!
    expect(document.activeElement).toBe(target)
    const ring = getComputedStyle(target, '::after')
    expect(ring.outlineStyle).toBe('solid')
    const drawn = target.getBoundingClientRect()
    expect(drawn.width).toBeLessThan(rows[0].getBoundingClientRect().width)
    await userEvent.tab()
    expect(document.activeElement).toBe(rows[0].querySelector('[data-part="actions"] button'))
  })

  it('the columns line up whatever a row has, and a long line is cut at the row’s end', async () => {
    const { rows } = await mount()
    const ends = rows.map((row) => row.querySelector('[data-part="actions"]')!.getBoundingClientRect().right)
    expect(Math.max(...ends) - Math.min(...ends)).toBeLessThan(1)
    const starts = rows.map((row) => row.querySelector('[data-part="body"]')!.getBoundingClientRect().left)
    expect(Math.max(...starts) - Math.min(...starts)).toBeLessThan(1)
    const line = rows[1].querySelector<HTMLElement>('[data-part="description"]')!
    expect(line.scrollWidth).toBeGreaterThan(line.clientWidth)
    expect(line.getBoundingClientRect().right).toBeLessThanOrEqual(rows[1].querySelector('[data-part="actions"]')!.getBoundingClientRect().left)
  })

  it('bordered holds its rows in one surface; cards stand apart', async () => {
    const bordered = await mount(vi.fn(), vi.fn(), 'bordered')
    const box = bordered.host.querySelector<HTMLElement>('[data-scope="list"][data-part="root"]')!
    expect(getComputedStyle(box).borderTopStyle).toBe('solid')
    const gapBordered = bordered.rows[1].getBoundingClientRect().top - bordered.rows[0].getBoundingClientRect().bottom
    root?.unmount()
    document.body.replaceChildren()
    const cards = await mount(vi.fn(), vi.fn(), 'cards')
    const gapCards = cards.rows[1].getBoundingClientRect().top - cards.rows[0].getBoundingClientRect().bottom
    expect(gapBordered).toBeLessThan(1)
    expect(gapCards).toBeGreaterThanOrEqual(8)
    expect(getComputedStyle(cards.rows[0]).borderTopStyle).toBe('solid')
  })
})
