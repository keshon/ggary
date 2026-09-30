import { afterEach, describe, expect, it } from 'vitest'
import '../packages/theme-ggarry/src/index.css'
import { createElement as h, Fragment } from 'react'
import { flushSync } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'
import { Button, Icon, Ribbon, RibbonGroup } from '../packages/react/src/index'
import type { RibbonItem } from '../packages/core/src/components/ribbon'
import { overflowGroups, toolTabs } from '../apps/docs/src/pages/ribbon/data'

/**
 * What only a browser answers about the ribbon's scroll: fades reported from
 * real layout, and a vertical wheel driving the panel sideways.
 */
let roots: Root[] = []
afterEach(() => {
  for (const root of roots) root.unmount()
  roots = []
  document.body.replaceChildren()
})

/** Renders into a narrow host, so the ribbon overflows for certain. */
const mount = (node: React.ReactNode, width = 320) => {
  const host = document.createElement('div')
  host.style.width = `${width}px`
  document.body.append(host)
  const root = createRoot(host)
  roots.push(root)
  flushSync(() => root.render(node))
  return host
}

const part = (root: Element, scope: string, name: string) =>
  root.querySelector<HTMLElement>(`[data-scope="${scope}"][data-part="${name}"]`)!

const loaded = (items: RibbonItem[] = toolTabs) =>
  h(Ribbon, {
    label: 'Many tools',
    items,
    defaultValue: items[0].value,
    children: () =>
      h(
        Fragment,
        null,
        overflowGroups.map((group) =>
          h(RibbonGroup, {
            key: group.label,
            label: group.label,
            children: group.tools.map((tool) => h(Button, { key: tool.name, size: 'sm', emphasis: 'minimal', 'aria-label': tool.name }, h(Icon, { name: tool.icon }))),
          })
        )
      ),
  })

const scrolled = (panel: HTMLElement, left: number) => {
  panel.scrollLeft = left
  // The real event fires off-frame; the listener only reads the position.
  panel.dispatchEvent(new Event('scroll'))
}

/** Passive attach effects settle on the next frame. */
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

describe('ribbon scroll in a real browser', () => {
  it('a fitting row has no overflow in either axis: nothing to bar', async () => {
    const host = mount(loaded(), 1800)
    await frame()
    const tabList = part(host, 'ribbon', 'tab-list')
    const panel = part(host, 'ribbon', 'panel')
    expect(tabList.scrollWidth).toBeLessThanOrEqual(tabList.clientWidth)
    expect(tabList.scrollHeight).toBeLessThanOrEqual(tabList.clientHeight)
    expect(panel.scrollWidth).toBeLessThanOrEqual(panel.clientWidth)
    expect(panel.scrollHeight).toBeLessThanOrEqual(panel.clientHeight)
  })

  it('an overflowing panel reports its edges for the fades, and goes quiet without overflow', async () => {
    const host = mount(loaded())
    await frame()
    const panel = part(host, 'ribbon', 'panel')
    expect(panel.scrollWidth).toBeGreaterThan(panel.clientWidth)
    expect(panel.hasAttribute('data-fade-start')).toBe(false)
    expect(panel.hasAttribute('data-fade-end')).toBe(true)

    scrolled(panel, 60)
    expect(panel.hasAttribute('data-fade-start')).toBe(true)
    expect(panel.hasAttribute('data-fade-end')).toBe(true)

    scrolled(panel, panel.scrollWidth)
    expect(panel.hasAttribute('data-fade-start')).toBe(true)
    expect(panel.hasAttribute('data-fade-end')).toBe(false)

    const calm = mount(
      h(Ribbon, {
        label: 'One tool',
        items: [{ value: 'only', label: 'Only' }],
        defaultValue: 'only',
        children: () => h(RibbonGroup, { label: 'Edit', children: h(Button, { size: 'sm', emphasis: 'minimal', 'aria-label': 'Cut' }, h(Icon, { name: 'cut' })) }),
      })
    )
    await frame()
    const single = part(calm, 'ribbon', 'panel')
    expect(single.hasAttribute('data-fade-start')).toBe(false)
    expect(single.hasAttribute('data-fade-end')).toBe(false)
  })

  it('a vertical wheel over the panel drives it sideways, and goes nowhere at the ends instead of mixing', async () => {
    const host = mount(loaded())
    await frame()
    const panel = part(host, 'ribbon', 'panel')
    const first = panel.querySelector('button')!

    const wheel = (deltaY: number) => {
      const event = new WheelEvent('wheel', { deltaY, bubbles: true, cancelable: true })
      first.dispatchEvent(event)
      return event
    }

    expect(wheel(120).defaultPrevented).toBe(true)
    expect(panel.scrollLeft).toBeGreaterThan(0)

    scrolled(panel, panel.scrollWidth)
    const end = panel.scrollLeft
    // At the end of the room the gesture is swallowed, not handed to the page.
    expect(wheel(120).defaultPrevented).toBe(true)
    expect(panel.scrollLeft).toBe(end)
    // The way back is the other direction.
    expect(wheel(-120).defaultPrevented).toBe(true)
    expect(panel.scrollLeft).toBeLessThan(end)
  })

  it('leaves the wheel alone where there is nowhere to go', async () => {
    const host = mount(
      h(Ribbon, {
        label: 'One tool',
        items: [{ value: 'only', label: 'Only' }],
        defaultValue: 'only',
        children: () => h(RibbonGroup, { label: 'Edit', children: h(Button, { size: 'sm', emphasis: 'minimal', 'aria-label': 'Cut' }, h(Icon, { name: 'cut' })) }),
      })
    )
    await frame()
    const first = part(host, 'ribbon', 'panel').querySelector('button')!
    const event = new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true })
    first.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })
})
