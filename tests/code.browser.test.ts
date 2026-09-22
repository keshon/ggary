import { afterEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import '../packages/theme-ggarry/src/index.css'
import { createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { CodeBlock, Copyable } from '../packages/react/src/index'

/**
 * CodeBlock and Copyable where only a browser can say: a real press on the
 * copy button with the clipboard stubbed and with it refusing, the fallback
 * through a selection, the live region's words, the button letting go; and
 * the layout — a long line scrolls under a button that stays in its corner,
 * the number column is 5ch, the tap area is 24px.
 */

let root: Root | null = null
afterEach(() => {
  root?.unmount()
  root = null
  document.body.replaceChildren()
  delete (navigator as { clipboard?: unknown }).clipboard
  delete (document as { execCommand?: unknown }).execCommand
})

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function mount(element: ReturnType<typeof h>, style = 'inline-size: 360px') {
  const host = document.createElement('div')
  host.style.cssText = style
  document.body.append(host)
  root = createRoot(host)
  root.render(element)
  await wait(30)
  return host
}

const q = (host: HTMLElement, scope: string, part: string) => host.querySelector<HTMLElement>(`[data-scope="${scope}"][data-part="${part}"]`)!

describe('copying', () => {
  it('writes the text, shows a tick, says "Copied", and lets go after a moment and a half', async () => {
    const writeText = vi.fn(async () => {})
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    const host = await mount(h(CodeBlock, { code: 'npm run assets\nnpm test', label: 'the commands' }))
    const copy = q(host, 'code', 'copy')
    await userEvent.click(copy)
    await wait(30)
    expect(writeText).toHaveBeenCalledWith('npm run assets\nnpm test')
    expect(copy.dataset.copied).toBe('true')
    expect(q(host, 'code', 'copy-icon').dataset.icon).toBe('check')
    expect(q(host, 'code', 'live').textContent).toBe('Copied')
    await wait(1600)
    expect(copy.hasAttribute('data-copied')).toBe(false)
    expect(q(host, 'code', 'live').textContent).toBe('')
  })

  it('when writeText rejects, the text goes through a selection, and focus comes back', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) }, configurable: true })
    let selected = ''
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: (command: string) => {
        const area = document.activeElement as HTMLTextAreaElement
        if (command === 'copy' && area instanceof HTMLTextAreaElement) selected = area.value.slice(area.selectionStart, area.selectionEnd)
        return true
      },
    })
    const host = await mount(h(Copyable, { value: 'a4f7c2e', copyValue: 'a4f7c2e91b0d5537' }))
    const copy = q(host, 'copyable', 'copy')
    await userEvent.click(copy)
    await wait(30)
    expect(selected).toBe('a4f7c2e91b0d5537')
    expect(copy.dataset.copied).toBe('true')
    expect(q(host, 'copyable', 'live').textContent).toBe('Copied')
    expect(document.activeElement).toBe(copy)
    expect(document.querySelector('textarea')).toBeNull()
  })

  it('when both ways fail it says so, in red, not "Copied"', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) }, configurable: true })
    Object.defineProperty(document, 'execCommand', { configurable: true, value: () => false })
    const host = await mount(h(Copyable, { value: 'a4f7c2e' }))
    const copy = q(host, 'copyable', 'copy')
    await userEvent.click(copy)
    await wait(30)
    expect(copy.dataset.copied).toBe('false')
    expect(q(host, 'copyable', 'live').textContent).toBe('Could not copy')
    expect(getComputedStyle(copy).color).not.toBe(getComputedStyle(q(host, 'copyable', 'value')).color)
  })
})

describe('layout', () => {
  it('a long line does not wrap: the content scrolls and the button stays in the corner', async () => {
    const long = 'docker run --rm -it -v "$PWD":/work -w /work ghcr.io/example/toolchain:latest make all'
    const host = await mount(h(CodeBlock, { code: `${long}\nls` }))
    const frame = q(host, 'code', 'root')
    const content = q(host, 'code', 'content')
    const copy = q(host, 'code', 'copy')
    expect(content.scrollWidth).toBeGreaterThan(content.clientWidth)
    // Two lines, not wrapped into more.
    const lineHeight = parseFloat(getComputedStyle(content).lineHeight)
    expect(content.scrollHeight - parseFloat(getComputedStyle(content).paddingTop) * 2).toBeLessThan(lineHeight * 3)

    const before = copy.getBoundingClientRect()
    content.scrollLeft = 200
    await wait(10)
    const after = copy.getBoundingClientRect()
    expect(after.left).toBe(before.left)
    // The far top corner: at the frame's end edge, on the first line.
    const box = frame.getBoundingClientRect()
    expect(box.right - after.right).toBeLessThan(16)
    expect(after.top - box.top).toBeLessThan(12)
  })

  it('the number column is exactly 5ch, whatever the numbers', async () => {
    const host = await mount(h(CodeBlock, { code: 'a\nb', numbered: true, start: 99 }))
    const [first, second] = [...host.querySelectorAll<HTMLElement>('[data-part="line-source"]')]
    expect(first.getBoundingClientRect().left).toBe(second.getBoundingClientRect().left)
    const number = q(host, 'code', 'line-number')
    const ch = document.createElement('span')
    ch.style.cssText = 'display:inline-block;inline-size:5ch;font:inherit'
    number.append(ch)
    expect(number.getBoundingClientRect().width).toBeCloseTo(ch.getBoundingClientRect().width, 0)
    ch.remove()
    expect(getComputedStyle(number).userSelect).toBe('none')
  })

  it('the copy buttons take a 24px tap though their glyphs are 14', async () => {
    const host = await mount(h(Copyable, { value: 'a4f7c2e' }))
    const copy = q(host, 'copyable', 'copy')
    const tap = getComputedStyle(copy, '::before')
    expect(tap.width).toBe('24px')
    expect(tap.height).toBe('24px')
    expect(q(host, 'copyable', 'copy-icon').getBoundingClientRect().width).toBe(14)
    // A press just outside the drawn button still lands on it.
    const box = copy.getBoundingClientRect()
    const hit = document.elementFromPoint(box.right + 2, box.top + box.height / 2)
    expect(hit).toBe(copy)
  })

  it('the content is reachable by Tab, and so is the copy button after it', async () => {
    const host = await mount(h(CodeBlock, { code: 'x' }))
    await userEvent.tab()
    expect(document.activeElement).toBe(q(host, 'code', 'content'))
    await userEvent.tab()
    expect(document.activeElement).toBe(q(host, 'code', 'copy'))
  })
})
