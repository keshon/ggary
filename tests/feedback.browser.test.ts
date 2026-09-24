import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import '../packages/theme-ggarry/src/index.css'
import { createElement as h, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'
import { Button, ContextMenu, Popconfirm } from '../packages/react/src/index'

/** What only a browser has: where the focus lands, where the menu stands, the real keys. */

let roots: Root[] = []
afterEach(() => {
  for (const root of roots) root.unmount()
  roots = []
  document.body.replaceChildren()
})

function mount(node: ReactNode) {
  const host = document.body.appendChild(document.createElement('div'))
  host.style.cssText = 'padding: 80px'
  const root = createRoot(host)
  roots.push(root)
  flushSync(() => root.render(node))
  return host
}
const frames = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

describe('popconfirm', () => {
  const confirm = (destructive: boolean) =>
    h(Popconfirm, {
      title: 'Delete this lead?',
      description: 'Its history goes with it.',
      destructive,
      confirmLabel: 'Delete',
      trigger: (props: object) => h(Button, { ...props, destructive }, 'Delete'),
    })

  it('puts the focus on Cancel when the action destroys; Escape closes it and hands the focus back', async () => {
    const host = mount(confirm(true))
    const trigger = host.querySelector<HTMLButtonElement>("[data-scope='button']")!
    await userEvent.click(trigger)
    await frames()
    expect(document.activeElement?.getAttribute('data-answer')).toBe('cancel')
    const content = host.querySelector("[data-scope='popconfirm'][data-part='content']")!
    expect(content.matches(':popover-open')).toBe(true)
    await userEvent.keyboard('{Escape}')
    await frames()
    expect(content.matches(':popover-open')).toBe(false)
    expect(document.activeElement).toBe(trigger)
  })

  it('puts the focus on the action when it destroys nothing, and stands under its trigger', async () => {
    const host = mount(confirm(false))
    const trigger = host.querySelector("[data-scope='button']")!
    await userEvent.click(trigger)
    await frames()
    expect(document.activeElement?.getAttribute('data-answer')).toBe('confirm')
    const content = host.querySelector("[data-scope='popconfirm'][data-part='content']")!.getBoundingClientRect()
    expect(content.top).toBeGreaterThanOrEqual(trigger.getBoundingClientRect().bottom)
  })
})

describe('context menu', () => {
  const menu = () =>
    h(ContextMenu, {
      items: [{ value: 'rename', label: 'Rename' }, { value: 'delete', label: 'Delete', destructive: true }],
      trigger: (props: object) => h('div', { ...props, tabIndex: 0, style: { inlineSize: '300px', blockSize: '120px' } }, 'report.pdf'),
    })

  it('stands at the pointer on a right click, on the menu itself rather than an item', async () => {
    const host = mount(menu())
    const target = host.querySelector<HTMLElement>('[data-context-menu]')!
    const box = target.getBoundingClientRect()
    await userEvent.click(target, { button: 'right', position: { x: 120, y: 40 } })
    await frames()
    const content = host.querySelector("[data-scope='menu'][data-part='content']")!
    expect(content.matches(':popover-open')).toBe(true)
    const placed = content.getBoundingClientRect()
    expect(Math.abs(placed.left - (box.left + 120))).toBeLessThan(8)
    expect(Math.abs(placed.top - (box.top + 40))).toBeLessThan(8)
    expect(target.dataset.contextMenu).toBe('open')
    expect(document.activeElement?.getAttribute('data-part')).not.toBe('item')
  })

  it('opens from Shift+F10 under the focused target, on the first item, and gives the focus back on Escape', async () => {
    const host = mount(menu())
    const target = host.querySelector<HTMLElement>('[data-context-menu]')!
    target.focus()
    await userEvent.keyboard('{Shift>}{F10}{/Shift}')
    await frames()
    const content = host.querySelector("[data-scope='menu'][data-part='content']")!
    expect(content.matches(':popover-open')).toBe(true)
    expect(document.activeElement?.textContent?.trim()).toBe('Rename')
    expect(content.getBoundingClientRect().top).toBeGreaterThanOrEqual(target.getBoundingClientRect().bottom - 1)
    await userEvent.keyboard('{Escape}')
    await frames()
    expect(content.matches(':popover-open')).toBe(false)
    expect(document.activeElement).toBe(target)
  })
})
