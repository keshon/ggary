import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import '../packages/theme-ggarry/src/index.css'
import { createElement, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Accordion, Progress, Tree } from '../packages/react/src/index'
import { files, sections } from './conformance/files'

/**
 * Accordion, Tree and Progress where only a browser can say: a closed section
 * findable by the page's search yet taking no room, a tree scrolling to the
 * focus under the real keyboard, and the amount drawn to the pixel.
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

async function render(element: ReactElement, style = 'inline-size: 360px') {
  const host = document.createElement('div')
  host.style.cssText = style
  document.body.append(host)
  root = createRoot(host)
  root.render(element)
  await frames(2)
  return host
}

describe('accordion', () => {
  it('a closed section is hidden until found, takes no room, and opens when the page finds text in it', async () => {
    const host = await render(createElement(Accordion, { items: sections, children: (item: { label: string }) => `The ${item.label.toLowerCase()} terms, in full.` }))
    const content = host.querySelectorAll<HTMLElement>('[data-part="content"]')[1]
    expect(content.getAttribute('hidden')).toBe('until-found')
    expect(content.getBoundingClientRect().height).toBe(0)
    // The browser's find-in-page fires this on the section before it scrolls to the match.
    content.dispatchEvent(new Event('beforematch'))
    await frames(2)
    expect(content.hasAttribute('hidden')).toBe(false)
    expect(content.getBoundingClientRect().height).toBeGreaterThan(20)
    const trigger = host.querySelectorAll<HTMLElement>('[data-part="trigger"]')[1]
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
  })

  it('a real Space and Enter open and close; the chevron turns', async () => {
    const host = await render(createElement(Accordion, { items: sections, children: () => 'Body' }))
    const trigger = host.querySelector<HTMLButtonElement>('[data-part="trigger"]')!
    trigger.focus()
    await userEvent.keyboard(' ')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    const indicator = trigger.querySelector<HTMLElement>('[data-part="indicator"]')!
    await Promise.all(indicator.getAnimations().map((animation) => animation.finished))
    expect(getComputedStyle(indicator).rotate).toBe('180deg')
    await userEvent.keyboard('{Enter}')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })
})

describe('tree', () => {
  it('the real keyboard walks it; a tree given a height scrolls to keep the focus in view', async () => {
    const host = await render(createElement(Tree, { items: files, label: 'Files', defaultExpanded: ['src', 'src/app', 'src/lib', 'tests'] }), 'inline-size: 240px; block-size: 120px; display: flex')
    const tree = host.querySelector<HTMLElement>('[role="tree"]')!
    tree.style.blockSize = '100%'
    await frames(1)
    expect(tree.scrollHeight).toBeGreaterThan(tree.clientHeight)
    const row = (value: string) => host.querySelector<HTMLElement>(`[data-value="${value}"]`)!
    row('src').focus()
    await userEvent.keyboard('{End}')
    expect(document.activeElement).toBe(row('readme'))
    const box = tree.getBoundingClientRect()
    const last = row('readme').getBoundingClientRect()
    expect(last.bottom).toBeLessThanOrEqual(box.bottom + 1)
    await userEvent.keyboard('{Home}{ArrowDown}{ArrowDown}{ArrowDown}')
    expect(document.activeElement).toBe(row('src/app/routes.ts'))
    expect(row('src/app/routes.ts').getBoundingClientRect().top).toBeGreaterThanOrEqual(box.top - 1)
  })

  it('each level steps in, and a leaf’s text lines up with its branch’s chevron room', async () => {
    const host = await render(createElement(Tree, { items: files, label: 'Files', defaultExpanded: ['src', 'src/app'] }))
    const text = (value: string) => host.querySelector(`[data-value="${value}"] [data-part="item-text"]`)!.getBoundingClientRect().left
    expect(text('src/app') - text('src')).toBe(16)
    expect(text('src/app/main.ts') - text('src/app')).toBe(16)
    expect(text('src/index.ts')).toBe(text('src/app'))
  })
})

describe('progress', () => {
  it('a bar draws its amount to the pixel, from the start edge in either direction', async () => {
    const host = await render(createElement(Progress, { value: 25, label: 'Upload' }), 'inline-size: 400px')
    const track = host.querySelector<HTMLElement>('[data-part="track"]')!.getBoundingClientRect()
    const range = host.querySelector<HTMLElement>('[data-part="range"]')!
    await new Promise((resolve) => setTimeout(resolve, 400))
    const drawn = range.getBoundingClientRect()
    expect(drawn.width).toBeCloseTo(track.width / 4, 0)
    expect(drawn.left).toBeCloseTo(track.left, 0)
    host.dir = 'rtl'
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(range.getBoundingClientRect().right).toBeCloseTo(track.right, 0)
  })

  it('a ring sweeps its amount; unknown, it turns', async () => {
    const host = await render(createElement('div', null, createElement(Progress, { value: 50, shape: 'ring', size: 'lg', label: 'Half' }), createElement(Progress, { shape: 'ring', label: 'Busy' })))
    const [half, busy] = host.querySelectorAll<HTMLElement>('[data-part="range"]')
    expect(getComputedStyle(half).backgroundImage).toContain('conic-gradient')
    expect(host.querySelector('[data-part="value-text"]')!.textContent).toBe('50%')
    expect(getComputedStyle(busy).animationName).toBe('gg-spin')
    const ring = host.querySelector<HTMLElement>('[data-part="track"]')!.getBoundingClientRect()
    expect(ring.width).toBe(48)
    expect(ring.height).toBe(48)
  })
})
