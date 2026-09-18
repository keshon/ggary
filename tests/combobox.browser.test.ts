import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import '../packages/theme-ggarry/src/index.css'
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Combobox } from '../packages/react/src/index'
import type { ComboboxItem } from '../packages/core/src/components/combobox'

/**
 * The combobox where only a browser can say: real typing, the list in the top
 * layer under the field and as wide as it, unclipped by an ancestor that hides
 * its overflow, Tab and a press outside closing it, chips wrapping in the box.
 */

const companies: ComboboxItem[] = Array.from({ length: 400 }, (_, i) => ({
  value: `c${i}`,
  label: `${['Acme', 'Borealis', 'Cobalt', 'Delta'][i % 4]} ${['Labs', 'Group', 'Works'][i % 3]} ${i}`,
  description: ['Moscow', 'Kazan', 'Perm'][i % 3],
}))

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
  clip.style.cssText = 'overflow: hidden; block-size: 80px; inline-size: 360px; padding: 8px'
  const after = document.createElement('button')
  after.textContent = 'After'
  document.body.append(clip, after)
  root = createRoot(clip)
  root.render(createElement(Combobox, { label: 'Company', items: companies, ...props }))
  while (!clip.querySelector('[data-part="input"]')) await frames(1)
  const input = clip.querySelector<HTMLInputElement>('[data-part="input"]')!
  const control = clip.querySelector<HTMLElement>('[data-part="control"]')!
  const content = () => clip.querySelector<HTMLElement>('[data-part="content"]')!
  return { clip, input, control, content, after }
}

describe('combobox', () => {
  it('typing shows the list under the field, as wide as it, over an ancestor that clips', async () => {
    const { input, control, content } = await mount()
    await userEvent.click(input)
    await userEvent.keyboard('cob')
    await frames(3)
    const list = content().getBoundingClientRect()
    const box = control.getBoundingClientRect()
    expect(list.height).toBeGreaterThan(100)
    expect(list.top).toBeGreaterThanOrEqual(box.bottom)
    // At least as wide as the field and lined up with it; wider only for a long option.
    expect(Math.abs(list.left - box.left)).toBeLessThan(1)
    expect(list.width).toBeGreaterThanOrEqual(box.width - 1)
    // Past the 80px ancestor that hides its overflow: the top layer.
    const middle = document.elementFromPoint(list.left + 20, list.top + 60)
    expect(content().contains(middle)).toBe(true)
    expect(document.activeElement).toBe(input)
  })

  it('arrows and Enter choose with the real keyboard; Tab moves on and the list goes', async () => {
    const chosen: string[][] = []
    const { input, after } = await mount({ onValueChange: (value: string[]) => chosen.push(value) })
    await userEvent.click(input)
    // Typing highlights the best match already; Enter takes it.
    await userEvent.keyboard('delta works 23{Enter}')
    expect(chosen).toEqual([['c23']])
    expect(input.value).toBe('Delta Works 23')
    await userEvent.keyboard('{ArrowDown}')
    expect(input.getAttribute('aria-expanded')).toBe('true')
    await userEvent.keyboard('{Tab}')
    expect(document.activeElement).toBe(after)
    expect(input.getAttribute('aria-expanded')).toBe('false')
  })

  it('a press outside closes the list and puts the field back', async () => {
    const { input } = await mount({ defaultValue: 'c1' })
    await userEvent.click(input)
    await userEvent.keyboard('{Control>}a{/Control}zzz')
    expect(input.getAttribute('aria-expanded')).toBe('true')
    await userEvent.click(document.body, { position: { x: 600, y: 400 } })
    expect(input.getAttribute('aria-expanded')).toBe('false')
    expect(input.value).toBe('Borealis Group 1')
  })

  it('chips wrap inside the field and the input keeps room to type', async () => {
    const { input, control, clip } = await mount({ multiple: true, defaultValue: ['c0', 'c1', 'c2', 'c3', 'c4'] })
    clip.style.blockSize = 'auto'
    await frames()
    const chips = [...control.querySelectorAll('[data-part="chip"]')].map((chip) => chip.getBoundingClientRect())
    expect(new Set(chips.map((box) => Math.round(box.top))).size).toBeGreaterThan(1)
    expect(input.getBoundingClientRect().width).toBeGreaterThan(40)
    for (const chip of chips) expect(chip.right).toBeLessThanOrEqual(control.getBoundingClientRect().right)
  })
})
