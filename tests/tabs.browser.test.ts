import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from '@vitest/browser/context'
import '../packages/theme-ggarry/src/index.css'
import { createElement as h, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'
import { Tabs } from '../packages/react/src/index'
import type { TabItem } from '../packages/core/src/components/tabs'

/**
 * Tabs where only a browser answers: the real Tab key reaching one stop, a long
 * strip of documents scrolling to keep the focused tab in sight, and a real
 * pointer closing a tab next to the focused one.
 */
const roots: Root[] = []
afterEach(() => {
  for (const root of roots.splice(0)) root.unmount()
  document.body.replaceChildren()
})

/** Renders synchronously, so the tabs are in the page when this returns. */
const mount = (node: ReactNode, style = '') => {
  const host = document.createElement('div')
  host.style.cssText = style
  document.body.append(host)
  const root = createRoot(host)
  roots.push(root)
  flushSync(() => root.render(node))
  return host
}

const tabByText = (host: Element, text: string) =>
  [...host.querySelectorAll<HTMLElement>('[data-scope="tabs"][data-part="tab"]')].find(
    (el) => el.querySelector('[data-part="tab-text"]')!.textContent === text
  )!

const panel = (host: Element, value: string) => host.querySelector<HTMLElement>(`[data-scope="tabs"][data-part="panel"][data-value="${value}"]`)

const panelText = (item: TabItem) => `${item.label} panel`

describe('tabs in a real browser', () => {
  it('Tab reaches the selected tab once, the arrows move along, and Tab goes on into the panel', async () => {
    const host = mount([
      h('button', { key: 'before', id: 'before' }, 'Before'),
      h(Tabs, {
        key: 'tabs',
        label: 'Object properties',
        items: [
          { value: 'geometry', label: 'Geometry' },
          { value: 'material', label: 'Material' },
          { value: 'scripts', label: 'Scripts' },
        ],
        children: panelText,
      }),
    ])
    ;(host.querySelector('#before') as HTMLElement).focus()
    await userEvent.tab()
    expect(document.activeElement).toBe(tabByText(host, 'Geometry'))
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(tabByText(host, 'Material'))
    expect(panel(host, 'material')!.hasAttribute('hidden')).toBe(false)
    // One stop for the whole list: the next Tab leaves it for the panel.
    await userEvent.tab()
    expect(document.activeElement).toBe(panel(host, 'material'))
  })

  it('vertical tabs stand beside their panel', async () => {
    const host = mount(
      h(Tabs, {
        orientation: 'vertical',
        label: 'Settings',
        items: [
          { value: 'account', label: 'Account' },
          { value: 'appearance', label: 'Appearance' },
        ],
        children: panelText,
      })
    )
    const list = host.querySelector('[data-part="list"]')!.getBoundingClientRect()
    const box = panel(host, 'account')!.getBoundingClientRect()
    expect(box.left).toBeGreaterThanOrEqual(list.right - 1)
    expect(Math.abs(box.top - list.top)).toBeLessThan(1)
  })

  it('a long strip scrolls to keep the focused tab in sight', async () => {
    await page.viewport(600, 400)
    const items = Array.from({ length: 30 }, (_, i) => ({ value: `f${i}`, label: `file-${i}.css`, closable: true }))
    const host = mount(h(Tabs, { variant: 'chips', label: 'Open files', items, children: panelText }), 'inline-size: 400px')
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
    // The owner removes a closed tab from its items, as a page would.
    function OpenFiles() {
      const [items, setItems] = useState<TabItem[]>([
        { value: 'a', label: 'a.css', closable: true },
        { value: 'b', label: 'b.css', closable: true },
        { value: 'c', label: 'c.css', closable: true },
      ])
      return h(Tabs, {
        variant: 'chips',
        label: 'Open files',
        items,
        onClose: (value: string) => setItems((current) => current.filter((item) => item.value !== value)),
        children: panelText,
      })
    }
    const host = mount(h(OpenFiles))
    tabByText(host, 'a.css').focus()
    await userEvent.hover(tabByText(host, 'b.css'))
    await userEvent.click(tabByText(host, 'b.css').querySelector('[data-part="close"]')!)
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect([...host.querySelectorAll('[data-part="tab-text"]')].map((el) => el.textContent)).toEqual(['a.css', 'c.css'])
    expect(document.activeElement).toBe(tabByText(host, 'a.css'))
    expect(host.querySelector('[data-part="tab"][aria-selected="true"]')!.getAttribute('data-value')).toBe('a')
  })
})
