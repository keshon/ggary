import { afterEach, describe, expect, it } from 'vitest'
import '../packages/theme-ggarry/src/index.css'
import { createElement as h } from 'react'
import { flushSync } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'
import { Anchor } from '../packages/react/src/index'

/**
 * What only a browser answers about Anchor: the reading followed down a page
 * that really scrolls, and the folded anchor standing at the window's corner.
 */
let roots: Root[] = []
afterEach(() => {
  for (const root of roots) root.unmount()
  roots = []
  document.body.replaceChildren()
  window.scrollTo(0, 0)
})

const mount = (props: Parameters<typeof Anchor>[0]) => {
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  roots.push(root)
  flushSync(() => root.render(h(Anchor, props)))
  return host
}

const frames = (count = 3) =>
  new Promise<void>((resolve) => {
    let left = count
    const tick = () => (--left <= 0 ? resolve() : requestAnimationFrame(tick))
    requestAnimationFrame(tick)
  })

const IDS = ['one', 'two', 'three', 'four']
const items = IDS.map((id) => ({ label: id, href: `#${id}` }))

/** A page of tall sections to read down. */
const page = () => {
  for (const id of IDS) {
    const section = document.createElement('section')
    section.id = id
    section.style.blockSize = '900px'
    document.body.append(section)
  }
}

const read = (host: Element) => host.querySelector('[aria-current="location"]')?.getAttribute('href')

describe('anchor in a real browser', () => {
  it('follows the reading down the page: the last section whose top has reached the line', async () => {
    page()
    const seen: string[] = []
    const host = mount({ label: 'On this page', items, offset: 50, onCurrentChange: (href) => seen.push(href) })
    await frames()
    expect(read(host)).toBe('#one')

    window.scrollTo(0, document.getElementById('two')!.offsetTop - 60)
    await frames()
    expect(read(host)).toBe('#two')

    window.scrollTo(0, document.getElementById('three')!.offsetTop - 200)
    await frames()
    // Three's top is still 200px down, under the line: two is being read.
    expect(read(host)).toBe('#two')

    window.scrollTo(0, document.documentElement.scrollHeight)
    await frames()
    expect(read(host)).toBe('#four')
    expect(seen).toContain('#two')
  })

  it('folded, it stands at the window’s end corner, the list opening above the button', async () => {
    const host = mount({ label: 'On this page', items, float: true, defaultOpen: true })
    await frames()
    const root = host.querySelector<HTMLElement>('[data-scope="anchor"][data-part="root"]')!
    const trigger = host.querySelector<HTMLElement>('[data-part="trigger"]')!
    const panel = host.querySelector<HTMLElement>('[data-part="panel"]')!
    expect(getComputedStyle(root).position).toBe('fixed')
    const box = trigger.getBoundingClientRect()
    expect(window.innerWidth - box.right).toBeCloseTo(16, 0)
    expect(window.innerHeight - box.bottom).toBeCloseTo(16, 0)
    expect(panel.getBoundingClientRect().bottom).toBeLessThanOrEqual(box.top)
  })

  it('a width in `float` folds it while the window is narrower', async () => {
    const host = mount({ label: 'On this page', items, float: 100_000 })
    await frames()
    expect(host.querySelector('[data-part="trigger"]')).not.toBeNull()
  })

  it('the current section’s bar sits on the rail', async () => {
    const host = mount({ label: 'On this page', items, current: '#two' })
    await frames()
    const list = host.querySelector<HTMLElement>('[data-part="list"]')!
    const link = host.querySelector<HTMLElement>('[aria-current="location"]')!
    const rail = list.getBoundingClientRect().left
    const bar = link.getBoundingClientRect().left
    // The bar (2px) starts on the rail's own pixel, so the rail runs through it.
    expect(Math.abs(bar - rail)).toBeLessThanOrEqual(1)
    expect(getComputedStyle(link).borderInlineStartWidth).toBe('2px')
  })
})
