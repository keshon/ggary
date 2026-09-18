import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from '@vitest/browser/context'
import '../packages/theme-ggarry/src/index.css'
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { CommandPalette } from '../packages/react/src/index'
import { commands } from './conformance/commands'

/**
 * The palette where only a browser can say: the real Ctrl+K from a page, the
 * dialog in the top layer high in the viewport over an inert page, the list
 * scrolling to keep the highlight in view, a server's records under their
 * heading, and a command that opens a dialog of its own after the palette
 * has let the focus go.
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
  await page.viewport(1000, 700)
  const before = document.createElement('button')
  before.textContent = 'Before'
  const host = document.createElement('div')
  document.body.append(before, host)
  root = createRoot(host)
  root.render(createElement(CommandPalette, { commands, ...props }))
  await frames(2)
  const content = () => host.querySelector<HTMLDialogElement>('[data-scope="command-palette"][data-part="content"]')!
  const input = () => host.querySelector<HTMLInputElement>('[data-part="input"]')!
  return { host, before, content, input }
}

describe('command palette', () => {
  it('the real Ctrl+K opens it in the top layer, high in the viewport, over a page that cannot be reached', async () => {
    const { before, content, input } = await mount()
    before.focus()
    await userEvent.keyboard('{Control>}k{/Control}')
    await frames(2)
    expect(content().matches(':modal')).toBe(true)
    expect(document.activeElement).toBe(input())
    const box = content().getBoundingClientRect()
    expect(box.top).toBeGreaterThan(40)
    expect(box.top).toBeLessThan(140)
    expect(Math.abs(box.left + box.width / 2 - 500)).toBeLessThan(2)
    expect(document.elementFromPoint(20, 680)).not.toBe(before)
    await userEvent.keyboard('{Control>}k{/Control}')
    await frames(1)
    expect(content().open).toBe(false)
    expect(document.activeElement).toBe(before)
  })

  it('the list scrolls to keep the highlight in view as the arrows walk it', async () => {
    const many = Array.from({ length: 40 }, (_, i) => ({ id: `c${i}`, label: `Command ${i + 1}`, group: i < 20 ? 'First' : 'Second' }))
    const { host } = await mount({ commands: many, defaultOpen: true })
    await frames(2)
    const list = host.querySelector<HTMLElement>('[data-part="list"]')!
    expect(list.scrollHeight).toBeGreaterThan(list.clientHeight)
    await userEvent.keyboard('{ArrowUp}')
    const last = document.getElementById(host.querySelector('[data-part="input"]')!.getAttribute('aria-activedescendant')!)!
    expect(last.textContent).toBe('Command 40')
    const lane = list.getBoundingClientRect()
    expect(last.getBoundingClientRect().bottom).toBeLessThanOrEqual(lane.bottom + 1)
  })

  it('a server’s records stand under their heading after the typing pauses', async () => {
    const asked: string[] = []
    const load = async (query: string) => {
      asked.push(query)
      return [{ id: `lead:${query}`, label: `Kazan Metro (${query})` }]
    }
    const { host } = await mount({ load, defaultOpen: true })
    await frames(1)
    await userEvent.keyboard('kaz')
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(asked).toEqual(['kaz'])
    const labels = [...host.querySelectorAll('[data-part="group-label"]')].map((label) => label.textContent)
    expect(labels).toEqual(['Results'])
    expect(host.querySelector('[data-part="item"][data-highlighted]')!.textContent).toBe('Kazan Metro (kaz)')
  })

  it('a command that opens a dialog of its own gets the focus, not the element before the palette', async () => {
    const other = document.createElement('dialog')
    const field = document.createElement('input')
    other.append(field)
    const openOther = () => {
      document.body.append(other)
      other.showModal()
      field.focus()
    }
    const { before } = await mount({ commands: [{ id: 'rename', label: 'Rename deal', run: openOther }] })
    before.focus()
    await userEvent.keyboard('{Control>}k{/Control}')
    await frames(1)
    await userEvent.keyboard('{Enter}')
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(other.open).toBe(true)
    expect(document.activeElement).toBe(field)
    other.close()
  })
})
