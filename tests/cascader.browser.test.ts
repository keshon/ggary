import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import '../packages/theme-ggarry/src/index.css'
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Cascader } from '../packages/react/src/index'
import { places } from './conformance/places'

/**
 * The cascader where only a browser can say: the columns under the button in
 * the top layer, standing side by side, and the real keyboard walking them.
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
  const clip = document.createElement('div')
  clip.style.cssText = 'overflow: hidden; block-size: 90px; inline-size: 320px; padding: 8px'
  document.body.append(clip)
  root = createRoot(clip)
  root.render(createElement(Cascader, { label: 'Place', items: places, ...props }))
  while (!clip.querySelector('[data-part="trigger"]')) await frames(1)
  return {
    trigger: clip.querySelector<HTMLButtonElement>('[data-part="trigger"]')!,
    content: () => clip.querySelector<HTMLElement>('[data-scope="cascader"][data-part="content"]')!,
    columns: () => [...clip.querySelectorAll<HTMLElement>('[data-scope="cascader"][data-part="column"]')],
    focused: () => document.activeElement?.querySelector('[data-part="item-text"]')?.textContent,
  }
}

describe('cascader', () => {
  it('the columns stand side by side under the button, over an ancestor that clips, the chosen one in view', async () => {
    const { trigger, content, columns } = await mount({ defaultValue: ['ru', 'tat', 'kzn'] })
    await userEvent.click(trigger)
    await frames(3)
    const card = content().getBoundingClientRect()
    const button = trigger.getBoundingClientRect()
    expect(card.top).toBeGreaterThanOrEqual(button.bottom)
    expect(Math.abs(card.left - button.left)).toBeLessThan(1)
    const [a, b, c] = columns().map((column) => column.getBoundingClientRect())
    expect(b.left).toBeGreaterThanOrEqual(a.right - 1)
    expect(c.left).toBeGreaterThanOrEqual(b.right - 1)
    expect(Math.abs(a.top - c.top)).toBeLessThan(1)
    // Three columns outrun a phone: the card keeps to the screen and scrolls
    // sideways, the item the keyboard is on brought into it.
    expect(card.right).toBeLessThanOrEqual(innerWidth)
    const item = (document.activeElement as HTMLElement).getBoundingClientRect()
    expect(document.elementFromPoint(item.left + item.width / 2, item.top + item.height / 2)?.closest('[data-part="item"]')).toBe(document.activeElement)
    expect(document.activeElement?.textContent).toContain('Kazan')
  })

  it('the real keyboard walks down and across; Enter chooses and the button shows the path', async () => {
    const chosen: unknown[] = []
    const { trigger, focused } = await mount({ onValueChange: (value: unknown) => chosen.push(value) })
    trigger.focus()
    await userEvent.keyboard('{ArrowDown}')
    await frames(2)
    expect(focused()).toBe('Russia')
    await userEvent.keyboard('{ArrowRight}{ArrowDown}{ArrowRight}')
    expect(focused()).toBe('Kazan')
    await userEvent.keyboard('{Enter}')
    await frames(2)
    expect(chosen).toEqual([['ru', 'tat', 'kzn']])
    expect(document.activeElement).toBe(trigger)
    expect(trigger.textContent).toBe('RussiaTatarstanKazan')
  })
})
