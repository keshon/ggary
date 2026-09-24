import { afterEach, describe, expect, it } from 'vitest'
import '../packages/theme-ggarry/src/index.css'
import { createElement as h, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'
import { Button, Column, Columns, Flex, FlexItem, Input } from '../packages/react/src/index'

/** Flex and Columns on a real page: shares of a row, spans at a width, nesting, the channel. */

let roots: Root[] = []
afterEach(() => {
  for (const root of roots) root.unmount()
  roots = []
  document.body.replaceChildren()
})

function mount(node: ReactNode, inlineSize: number) {
  const host = document.body.appendChild(document.createElement('div'))
  host.style.inlineSize = `${inlineSize}px`
  const root = createRoot(host)
  roots.push(root)
  flushSync(() => root.render(node))
  return host
}
const width = (el: Element) => el.getBoundingClientRect().width
const box = (text: string) => h('div', { style: { blockSize: '20px' } }, text)

describe('flex', () => {
  it('shares what is left by grow: 1 and 2 of the room beside a fixed item', () => {
    const host = mount(
      h(Flex, { gap: 'none' }, h(FlexItem, { grow: true }, box('one')), h(FlexItem, { grow: 2 }, box('two')), h('div', { style: { inlineSize: '90px' } }, 'fixed')),
      390
    )
    const [one, two] = host.querySelectorAll("[data-scope='flex-item']")
    expect(width(one)).toBeCloseTo(100, 0)
    expect(width(two)).toBeCloseTo(200, 0)
  })

  it('lets a field in a growing item narrow below its content, beside a button that keeps its width', () => {
    const host = mount(h(Flex, { align: 'center' }, h(FlexItem, { grow: true }, h(Input, { 'aria-label': 'Search' })), h(Button, null, 'Filter')), 240)
    const item = host.querySelector("[data-scope='flex-item']")!
    const button = host.querySelector("[data-scope='button']")!
    expect(item.getBoundingClientRect().right).toBeLessThanOrEqual(button.getBoundingClientRect().left)
    expect(button.getBoundingClientRect().right).toBeLessThanOrEqual(240.5)
  })

  it('a column with no alignment keeps a button at its own width, as a Stack does; told to stretch, it stretches it', () => {
    const host = mount(h('div', null, h(Flex, { direction: 'column' }, h(Button, null, 'Save')), h(Flex, { direction: 'column', align: 'stretch' }, h(Button, null, 'Save'))), 400)
    const [kept, stretched] = host.querySelectorAll("[data-scope='button']")
    expect(width(kept)).toBeLessThan(200)
    expect(width(stretched)).toBeCloseTo(400, 0)
  })

  it('pushes to both ends along a row', () => {
    const host = mount(h(Flex, { justify: 'between' }, box('start'), box('end')), 400)
    const [start, end] = host.querySelectorAll("[data-scope='flex'] > div")
    expect(start.getBoundingClientRect().left).toBeCloseTo(host.getBoundingClientRect().left, 0)
    expect(end.getBoundingClientRect().right).toBeCloseTo(host.getBoundingClientRect().right, 0)
  })
})

describe('columns', () => {
  const layout = () =>
    h(Columns, { gap: 'none' },
      h(Column, { span: { base: 12, medium: 8 } }, box('main')),
      h(Column, { span: { base: 12, medium: 4 } }, box('side')),
    )

  it('below its medium width, both span the row; from it, eight and four twelfths side by side', () => {
    const narrow = mount(layout(), 600)
    const [a, b] = narrow.querySelectorAll("[data-scope='column']")
    expect([width(a), width(b)]).toEqual([600, 600])
    expect(b.getBoundingClientRect().top).toBeGreaterThan(a.getBoundingClientRect().top)

    const wide = mount(layout(), 960)
    const [c, d] = wide.querySelectorAll("[data-scope='column']")
    expect(width(c)).toBeCloseTo(640, 0)
    expect(width(d)).toBeCloseTo(320, 0)
    expect(d.getBoundingClientRect().top).toBeCloseTo(c.getBoundingClientRect().top, 0)
  })

  it('answers to its own width, not the window: nested in a third of a wide row, it stacks', () => {
    const host = mount(
      h(Columns, { gap: 'none' },
        h(Column, { span: 8 }, box('main')),
        h(Column, { span: 4 }, layout()),
      ),
      1200
    )
    const inner = host.querySelectorAll("[data-scope='columns'] [data-scope='columns'] > [data-scope='column']")
    // The outer row is 1200 wide; the inner Columns is 400, under its medium width.
    expect([width(inner[0]), width(inner[1])]).toEqual([400, 400])
  })

  it('starts a column at the line it names, which is what an offset is', () => {
    const host = mount(h(Columns, { gap: 'none' }, h(Column, { span: 4, start: 5 }, box('centre'))), 1200)
    const column = host.querySelector("[data-scope='column']")!
    expect(column.getBoundingClientRect().left - host.getBoundingClientRect().left).toBeCloseTo(400, 0)
    expect(width(column)).toBeCloseTo(400, 0)
  })

  it('holds its gutter across and down', () => {
    const host = mount(h(Columns, null, h(Column, { span: 6 }, box('a')), h(Column, { span: 6 }, box('b')), h(Column, null, box('c'))), 1000)
    const [a, b, c] = host.querySelectorAll("[data-scope='column']")
    const across = b.getBoundingClientRect().left - a.getBoundingClientRect().right
    const down = c.getBoundingClientRect().top - a.getBoundingClientRect().bottom
    expect(across).toBeGreaterThan(0)
    expect(down).toBeCloseTo(across, 0)
  })
})
