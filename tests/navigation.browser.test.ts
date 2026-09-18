import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import '../packages/theme-ggarry/src/index.css'
import { createElement as h, Fragment, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'
import { Breadcrumbs, Pagination, Search, Steps, Toolbar, ToolbarSeparator, ToolbarSpacer } from '../packages/react/src/index'

/**
 * What only a browser answers about the navigation components: the real Tab and
 * arrow keys on a toolbar, and the separators that are drawn but never read.
 */
let roots: Root[] = []
afterEach(() => {
  for (const root of roots) root.unmount()
  roots = []
  document.body.replaceChildren()
})

/** Renders into a fresh host on the body, synchronously, and returns the host. */
const mount = (node: ReactNode) => {
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  roots.push(root)
  flushSync(() => root.render(node))
  return host
}

const part = (root: Element, scope: string, name: string) =>
  root.querySelector<HTMLElement>(`[data-scope="${scope}"][data-part="${name}"]`)!

const toolbarOf = (host: Element) => part(host, 'toolbar', 'root')
const toolButtons = (host: Element) => [...toolbarOf(host).querySelectorAll('button')] as HTMLButtonElement[]
const tool = (label: string, disabled = false) => h('button', { key: label, type: 'button', disabled }, label)

describe('toolbar in a real browser', () => {
  const strip = () =>
    h(
      Fragment,
      null,
      h('button', { id: 'before' }, 'Before'),
      h(Toolbar, { label: 'Tools', children: [tool('Move'), tool('Rotate'), tool('Scale', true), h(ToolbarSeparator, { key: 'sep' }), tool('Snap')] }),
      h('button', { id: 'after' }, 'After')
    )

  it('is one tab stop, and the arrows walk it, skipping what cannot be used', async () => {
    const host = mount(strip())
    const buttons = toolButtons(host)
    ;(host.querySelector('#before') as HTMLElement).focus()

    await userEvent.tab()
    expect(document.activeElement).toBe(buttons[0])

    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(buttons[1])
    // Scale is disabled: the arrows step over it rather than landing on it.
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(buttons[3])

    // A strip has two ends and no beginning to get stuck against.
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(buttons[0])
    await userEvent.keyboard('{ArrowLeft}')
    expect(document.activeElement).toBe(buttons[3])

    await userEvent.keyboard('{Home}')
    expect(document.activeElement).toBe(buttons[0])
    await userEvent.keyboard('{End}')
    expect(document.activeElement).toBe(buttons[3])

    // One stop for the strip: Tab leaves it rather than walking the tools.
    await userEvent.tab()
    expect(document.activeElement).toBe(host.querySelector('#after'))
  })

  it('comes back to the tool last used, which is what a toolbar is for', async () => {
    const host = mount(strip())
    const buttons = toolButtons(host)
    ;(host.querySelector('#before') as HTMLElement).focus()
    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(buttons[1])

    await userEvent.tab()
    expect(document.activeElement).toBe(host.querySelector('#after'))
    await userEvent.tab({ shift: true })
    expect(document.activeElement).toBe(buttons[1])
  })

  it('the spacer pushes the tail to the far edge of the strip', () => {
    const host = mount(
      h(Toolbar, {
        label: 'Tools',
        style: { width: '400px' },
        children: [tool('One'), h(ToolbarSeparator, { key: 'sep' }), tool('Two'), h(ToolbarSpacer, { key: 'spacer' }), h('span', { key: 'tail', id: 'tail' }, 'Saved')],
      })
    )
    const strip = toolbarOf(host)
    const tail = host.querySelector('#tail')!
    const inset = parseFloat(getComputedStyle(strip).paddingInlineEnd)
    expect(tail.getBoundingClientRect().right).toBeCloseTo(strip.getBoundingClientRect().right - inset, 0)
  })

  it('a field inside the strip keeps its own arrows: they move the caret', async () => {
    const host = mount(h(Toolbar, { label: 'Filters', children: [tool('All'), h(Search, { key: 'search', defaultValue: 'worldgen' })] }))
    const input = host.querySelector('input')!
    input.focus()
    input.setSelectionRange(5, 5)
    await userEvent.keyboard('{ArrowLeft}')
    expect(document.activeElement).toBe(input)
    expect(input.selectionStart).toBe(4)
  })

  it('an unnamed strip promises nothing: every tool keeps its own tab stop', async () => {
    const host = mount(h(Fragment, null, h('button', { id: 'before' }, 'Before'), h(Toolbar, { children: [tool('One'), tool('Two')] })))
    const buttons = toolButtons(host)
    ;(host.querySelector('#before') as HTMLElement).focus()
    await userEvent.tab()
    expect(document.activeElement).toBe(buttons[0])
    await userEvent.tab()
    expect(document.activeElement).toBe(buttons[1])
  })
})

describe('breadcrumbs and steps in a real browser', () => {
  it('the chevron between crumbs is drawn, and is in neither the text nor the tree', () => {
    const host = mount(
      h(Breadcrumbs, {
        label: 'Breadcrumbs',
        items: [{ label: 'Projects', href: '#a' }, { label: 'worldgen', href: '#b' }, { label: 'Run #4127' }],
      })
    )
    const crumbs = part(host, 'breadcrumbs', 'root')
    const second = [...crumbs.querySelectorAll('[data-part="item"]')][1]
    const drawn = getComputedStyle(second, '::before')
    expect(drawn.maskImage === 'none' ? drawn.webkitMaskImage : drawn.maskImage).toContain('url(')
    // The path carries no separator character: a screen reader reads the crumbs,
    // not a line of angle brackets, and neither does a copy of it.
    expect(crumbs.textContent).not.toMatch(/[>\/›❯]/)
    expect([...crumbs.querySelectorAll('[data-part="item"]')].map((item) => item.textContent)).toEqual([
      'Projects',
      'worldgen',
      'Run #4127',
    ])
  })

  it('a step’s bar spans its whole item, so it cannot part from the label', () => {
    const host = mount(
      h(Steps, {
        label: 'Import',
        items: [
          { name: 'Source', state: 'done' },
          { name: 'Check', state: 'current' },
          { name: 'Launch', state: 'todo' },
        ],
      })
    )
    const items = [...host.querySelectorAll('[data-scope="steps"][data-part="item"]')] as HTMLElement[]
    expect(items).toHaveLength(3)
    for (const item of items) {
      const bar = getComputedStyle(item, '::before')
      expect(bar.content).not.toBe('none')
      expect(parseFloat(bar.width)).toBeCloseTo(item.getBoundingClientRect().width, 0)
    }
    // Done and current share the reached colour; the one to come does not.
    const colour = (item: HTMLElement) => getComputedStyle(item, '::before').backgroundColor
    expect(colour(items[0])).toBe(colour(items[1]))
    expect(colour(items[2])).not.toBe(colour(items[1]))
  })

  it('a spent page takes no pointer, and the words of the path are not links', () => {
    const host = mount(
      h(Pagination, {
        label: 'Pages',
        items: [
          { label: 'Back', href: '#p7', disabled: true },
          { label: '8', href: '#p8', current: true },
          { label: '…', gap: true },
        ],
      })
    )
    const back = part(part(host, 'pagination', 'root'), 'pagination', 'link')
    expect(back.textContent).toBe('Back')
    expect(getComputedStyle(back).pointerEvents).toBe('none')
  })
})
