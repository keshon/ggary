import { afterEach, describe, expect, it } from 'vitest'
import '../packages/theme-ggarry/src/index.css'
import { createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Icon, defineIcons, iconNames } from '../packages/react/src/index'

/**
 * Icons where only a browser can say: every name the kit ships drawn by a
 * glyph, an icon the size and colour of the text around it, the three sizes,
 * and a glyph added at runtime drawn — and winning over the kit's own,
 * which sit in a cascade layer.
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

async function mount(node: ReturnType<typeof h>) {
  const host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  root.render(node)
  await frames(3)
  return host
}

const glyphOf = (element: Element) => getComputedStyle(element).getPropertyValue('--gg-icon').trim()

describe('icons', () => {
  it('every name the kit ships is drawn by a glyph', async () => {
    const host = await mount(h('div', null, iconNames.map((name) => h(Icon, { key: name, name }))))
    const blank = [...host.querySelectorAll<HTMLElement>('[data-scope="icon"]')].filter((icon) => !glyphOf(icon).startsWith('url(')).map((icon) => icon.dataset.icon)
    expect(blank).toEqual([])
    expect(iconNames.length).toBeGreaterThanOrEqual(89)
  })

  it('without a size it is the size and colour of the text around it', async () => {
    const host = await mount(h('p', { style: { fontSize: '20px', color: 'rgb(200, 30, 60)' } }, 'Saved ', h(Icon, { name: 'check' })))
    const icon = host.querySelector<HTMLElement>('[data-scope="icon"]')!
    const box = icon.getBoundingClientRect()
    expect([box.width, box.height]).toEqual([20, 20])
    expect(getComputedStyle(icon).backgroundColor).toBe('rgb(200, 30, 60)')
    expect(getComputedStyle(icon).maskImage).toContain('data:image/svg+xml')
  })

  it('takes the controls’ sizes: 14, 16 and 20 pixels', async () => {
    const host = await mount(h('div', null, (['sm', 'md', 'lg'] as const).map((size) => h(Icon, { key: size, name: 'star', size }))))
    const widths = [...host.querySelectorAll<HTMLElement>('[data-scope="icon"]')].map((icon) => icon.getBoundingClientRect().width)
    expect(widths).toEqual([14, 16, 20])
  })

  it('a glyph added at runtime is drawn, and one named as a kit glyph replaces it', async () => {
    const before = await mount(h('div', null, h(Icon, { name: 'bell' })))
    const kitBell = glyphOf(before.querySelector('[data-scope="icon"]')!)
    root?.unmount()
    document.body.replaceChildren()
    defineIcons({
      comet: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="#000"><path d="M2 14 14 2"/></svg>',
      bell: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="#000"><circle cx="8" cy="8" r="5"/></svg>',
    })
    const host = await mount(h('div', null, h(Icon, { name: 'comet' as never }), h(Icon, { name: 'bell' })))
    const [comet, bell] = [...host.querySelectorAll<HTMLElement>('[data-scope="icon"]')]
    expect(glyphOf(comet)).toContain(encodeURIComponent('<path d="M2 14 14 2"/>'))
    expect(getComputedStyle(comet).maskImage).toContain('data:image/svg+xml')
    expect(glyphOf(bell)).not.toBe(kitBell)
    expect(glyphOf(bell)).toContain(encodeURIComponent('<circle cx="8" cy="8" r="5"/>'))
  })
})
