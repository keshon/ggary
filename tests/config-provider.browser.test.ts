import { afterEach, describe, expect, it } from 'vitest'
import '../packages/theme-ggarry/src/index.css'
import { createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Button, ConfigProvider } from '../packages/react/src/index'

/**
 * The provider where only a browser can say: it takes no box, so a flex row
 * still lays out what it wraps; the direction it sets reaches the components
 * under it; and a dark island recolours the page's own text there.
 */

let root: Root | null = null
afterEach(() => {
  root?.unmount()
  root = null
  document.body.replaceChildren()
  delete document.documentElement.dataset.mode
})

const frames = (count = 3) =>
  new Promise<void>((resolve) => {
    let left = count
    const tick = () => (--left <= 0 ? resolve() : requestAnimationFrame(tick))
    requestAnimationFrame(tick)
  })

async function mount(node: ReturnType<typeof h>) {
  const host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  root.render(node)
  await frames(3)
  return host
}

describe('config provider', () => {
  it('takes no box: a flex row lays out what it wraps as its own children', async () => {
    const host = await mount(
      h('div', { style: { display: 'flex', gap: '16px' }, 'data-testid': 'row' },
        h(ConfigProvider, { size: 'sm' }, h(Button, null, 'One'), h(Button, null, 'Two'))),
    )
    const provider = host.querySelector<HTMLElement>('[data-scope="config-provider"]')!
    expect(getComputedStyle(provider).display).toBe('contents')
    const [one, two] = [...host.querySelectorAll<HTMLElement>('[data-scope="button"]')].map((button) => button.getBoundingClientRect())
    expect(Math.abs(two.left - one.right - 16)).toBeLessThan(1)
    expect(Math.abs(two.top - one.top)).toBeLessThan(1)
  })

  it('its direction reaches what is under it, and a dark island recolours the page’s own text', async () => {
    document.documentElement.dataset.mode = 'light'
    const host = await mount(
      h('div', null,
        h('p', { 'data-testid': 'outside' }, 'Outside'),
        h(ConfigProvider, { dir: 'rtl', mode: 'dark' }, h('p', { 'data-testid': 'inside' }, 'Inside'), h(Button, null, 'Save'))),
    )
    const inside = host.querySelector<HTMLElement>('[data-testid="inside"]')!
    const outside = host.querySelector<HTMLElement>('[data-testid="outside"]')!
    expect(getComputedStyle(inside).direction).toBe('rtl')
    expect(host.querySelector('[data-scope="button"]')!.matches(':dir(rtl)')).toBe(true)
    expect(getComputedStyle(inside).color).not.toBe(getComputedStyle(outside).color)
  })
})
