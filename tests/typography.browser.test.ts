import { afterEach, describe, expect, it } from 'vitest'
import '../packages/theme-ggarry/src/index.css'
import { createElement as h, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'
import { Divider, Prose, Text } from '../packages/react/src/index'

/** What typography promises on the page, measured: the ladder, the measure, the cut, the line. */

let roots: Root[] = []
afterEach(() => {
  for (const root of roots) root.unmount()
  roots = []
  document.body.replaceChildren()
})

function mount(node: ReactNode, css = '') {
  const host = document.body.appendChild(document.createElement('div'))
  host.style.cssText = css
  const root = createRoot(host)
  roots.push(root)
  flushSync(() => root.render(node))
  return host
}
const px = (el: Element | null, property: string) => parseFloat(getComputedStyle(el!).getPropertyValue(property))

describe('prose', () => {
  const html = '<h1>One</h1><h2>Two</h2><h3>Three</h3><h4>Four</h4><p>' + 'word '.repeat(80) + '</p>'

  it('climbs the ladder 28, 22, 18, 16 over a 16px body, and one step down at sm', () => {
    const md = mount(h(Prose, { dangerouslySetInnerHTML: { __html: html } }))
    expect(['h1', 'h2', 'h3', 'h4', 'p'].map((tag) => px(md.querySelector(tag), 'font-size'))).toEqual([28, 22, 18, 16, 16])
    const sm = mount(h(Prose, { size: 'sm', dangerouslySetInnerHTML: { __html: html } }))
    expect(['h1', 'h2', 'h3', 'h4', 'p'].map((tag) => px(sm.querySelector(tag), 'font-size'))).toEqual([22, 18, 16, 14, 14])
  })

  it('holds a line to the reading measure in a wide column', () => {
    const host = mount(h(Prose, { dangerouslySetInnerHTML: { __html: html } }), 'inline-size: 1600px')
    const prose = host.querySelector("[data-scope='prose']")!
    const ch = px(prose, 'font-size') * 0.5
    // 68ch in a proportional face: well under the column, around 68 average characters.
    expect(prose.getBoundingClientRect().width).toBeLessThan(1600 / 2)
    expect(prose.getBoundingClientRect().width).toBeGreaterThan(40 * ch)
  })

  it('sets a heading farther from what comes before it than from what follows', () => {
    const host = mount(h(Prose, { dangerouslySetInnerHTML: { __html: '<p>Before</p><h2>Heading</h2><p>After</p>' } }))
    const [before, heading, after] = [...host.querySelectorAll('p, h2')].map((el) => el.getBoundingClientRect())
    expect(heading.top - before.bottom).toBeGreaterThan(after.top - heading.bottom)
  })
})

describe('text', () => {
  it('cut to two lines is two lines tall, and one line keeps to its width with an ellipsis', () => {
    const long = 'A description long enough to need cutting, running on well past the second line of a narrow column. '.repeat(2)
    const host = mount(h('div', { style: { inlineSize: '200px' } }, h(Text, { truncate: 2 }, long), h('br'), h(Text, { truncate: true }, long), h('br'), h(Text, { truncate: 2 }, 'Short')))
    const [two, one, short] = host.querySelectorAll("[data-scope='text']")
    expect(Math.round(two.getBoundingClientRect().height / short.getBoundingClientRect().height)).toBe(2)
    expect(one.getBoundingClientRect().width).toBeLessThanOrEqual(200)
    expect(getComputedStyle(one).textOverflow).toBe('ellipsis')
  })
})

describe('divider', () => {
  it('draws one line across without a label; a start label sits at the edge with the line after it', () => {
    const host = mount(h('div', { style: { inlineSize: '400px' } }, h(Divider), h(Divider, { label: 'Advanced' }), h(Divider, { label: 'or', align: 'center' })), 'inline-size: 400px')
    const [plain, start, center] = host.querySelectorAll("[data-scope='divider'][data-part='root']")
    expect(getComputedStyle(plain, '::before').borderTopWidth).toBe('1px')
    expect(getComputedStyle(plain, '::after').display).toBe('none')
    expect(getComputedStyle(start, '::before').display).toBe('none')
    const label = start.querySelector("[data-part='label']")!.getBoundingClientRect()
    expect(label.left - start.getBoundingClientRect().left).toBeLessThan(1)
    const middle = center.querySelector("[data-part='label']")!.getBoundingClientRect()
    const box = center.getBoundingClientRect()
    expect(Math.abs(middle.left + middle.width / 2 - (box.left + box.width / 2))).toBeLessThan(2)
  })

  it('stands vertical at the height of a line of the row it is in', () => {
    const host = mount(h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } }, 'Edit', h(Divider, { orientation: 'vertical' }), 'Delete'))
    const line = host.querySelector("[data-scope='divider']")!
    expect(line.getBoundingClientRect().height).toBeCloseTo(px(line, 'line-height'), 0)
    expect(getComputedStyle(line).borderInlineStartWidth).toBe('1px')
  })
})
