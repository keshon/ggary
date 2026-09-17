import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from '@vitest/browser/context'
import '../packages/structure/src/index.css'
import '../packages/elements/src/index'
import type { GgTabsElement } from '../packages/elements/src/index'

/**
 * Tabs where only a browser answers: the real Tab key reaching one stop, a long
 * strip of documents scrolling to keep the focused tab in sight, and a real
 * pointer closing a tab next to the focused one.
 */
afterEach(() => {
  document.body.replaceChildren()
})

const mount = (html: string) => {
  const host = document.createElement('div')
  host.innerHTML = html
  document.body.append(host)
  return host
}

const tabByText = (host: Element, text: string) =>
  [...host.querySelectorAll<HTMLElement>('[data-scope="tabs"][data-part="tab"]')].find(
    (el) => el.querySelector('[data-part="tab-text"]')!.textContent === text
  )!

describe('tabs in a real browser', () => {
  it('Tab reaches the selected tab once, the arrows move along, and Tab goes on into the panel', async () => {
    const host = mount(`
      <button id="before">Before</button>
      <gg-tabs label="Object properties">
        <section data-tab="geometry" data-label="Geometry">Vertices</section>
        <section data-tab="material" data-label="Material">Textures</section>
        <section data-tab="scripts" data-label="Scripts">Behaviours</section>
      </gg-tabs>`)
    ;(host.querySelector('#before') as HTMLElement).focus()
    await userEvent.tab()
    expect(document.activeElement).toBe(tabByText(host, 'Geometry'))
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(tabByText(host, 'Material'))
    expect(host.querySelector('[data-tab="material"]')!.hasAttribute('hidden')).toBe(false)
    // One stop for the whole list: the next Tab leaves it for the panel.
    await userEvent.tab()
    expect(document.activeElement).toBe(host.querySelector('[data-tab="material"]'))
  })

  it('vertical tabs stand beside their panel', async () => {
    const host = mount(`
      <gg-tabs orientation="vertical" label="Settings">
        <section data-tab="account" data-label="Account">Account settings</section>
        <section data-tab="appearance" data-label="Appearance">Theme and density</section>
      </gg-tabs>`)
    const list = host.querySelector('[data-part="list"]')!.getBoundingClientRect()
    const panel = host.querySelector('[data-tab="account"]')!.getBoundingClientRect()
    expect(panel.left).toBeGreaterThanOrEqual(list.right - 1)
    expect(Math.abs(panel.top - list.top)).toBeLessThan(1)
  })

  it('a long strip scrolls to keep the focused tab in sight', async () => {
    await page.viewport(600, 400)
    const panels = Array.from({ length: 30 }, (_, i) => `<section data-tab="f${i}" data-label="file-${i}.css" data-closable>File ${i}</section>`).join('')
    const host = mount(`<div style="inline-size: 400px"><gg-tabs variant="chips" label="Open files">${panels}</gg-tabs></div>`)
    const list = host.querySelector('[data-part="list"]') as HTMLElement
    expect(list.scrollWidth).toBeGreaterThan(list.clientWidth)
    tabByText(host, 'file-0.css').focus()
    await userEvent.keyboard('{End}')
    const last = tabByText(host, 'file-29.css')
    expect(document.activeElement).toBe(last)
    expect(list.scrollLeft).toBeGreaterThan(0)
    const box = last.getBoundingClientRect()
    const strip = list.getBoundingClientRect()
    expect(box.right).toBeLessThanOrEqual(strip.right + 1)
    expect(box.left).toBeGreaterThanOrEqual(strip.left - 1)
  })

  it('a real click on a close button closes that tab and leaves focus where it was', async () => {
    const host = mount(`
      <gg-tabs variant="chips" label="Open files">
        <section data-tab="a" data-label="a.css" data-closable>A</section>
        <section data-tab="b" data-label="b.css" data-closable>B</section>
        <section data-tab="c" data-label="c.css" data-closable>C</section>
      </gg-tabs>`)
    const tabs = host.querySelector('gg-tabs') as GgTabsElement
    tabs.addEventListener('tabclose', (event) => host.querySelector(`[data-tab="${(event as CustomEvent).detail.value}"]`)?.remove())
    tabByText(host, 'a.css').focus()
    await userEvent.hover(tabByText(host, 'b.css'))
    await userEvent.click(tabByText(host, 'b.css').querySelector('[data-part="close"]')!)
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect([...host.querySelectorAll('[data-part="tab-text"]')].map((el) => el.textContent)).toEqual(['a.css', 'c.css'])
    expect(document.activeElement).toBe(tabByText(host, 'a.css'))
    expect(tabs.value).toBe('a')
  })
})
