import { afterEach, describe, expect, it } from 'vitest'
import { page } from '@vitest/browser/context'
import '../packages/theme-ggarry/src/index.css'
import { createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Diff, Lanes, Log, Step } from '../packages/react/src/index'
import type { LogLine } from '../packages/core/src/components/log'

/**
 * The agent layer where only a browser can say: a log that holds its tail and
 * lets go under a reader's scroll, a diff whose lines copy as clean code, a
 * step that find-in-page opens, and segments measured on a real axis.
 */

let root: Root | null = null
afterEach(() => {
  root?.unmount()
  root = null
  document.body.replaceChildren()
})

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function mount(element: ReturnType<typeof h>, style = 'inline-size: 700px') {
  await page.viewport(1000, 700)
  const host = document.createElement('div')
  host.style.cssText = style
  document.body.append(host)
  root = createRoot(host)
  root.render(element)
  await wait(60)
  return host
}

const line = (i: number): LogLine => ({ id: String(i), level: i % 9 === 0 ? 'warn' : 'info', time: '14:32:07', text: `line ${i}` })
const stream = (count: number) => Array.from({ length: count }, (_, i) => line(i))

describe('log', () => {
  it('holds the bottom as lines arrive', async () => {
    const host = await mount(h(Log as never, { lines: stream(60), label: 'The log', style: { blockSize: '120px' } }))
    const log = host.querySelector<HTMLElement>('[data-scope="log"][data-part="root"]')!
    expect(log.scrollHeight).toBeGreaterThan(log.clientHeight)
    expect(log.scrollTop).toBeCloseTo(log.scrollHeight - log.clientHeight, 0)
    expect(log.dataset.following).toBe('true')

    root!.render(h(Log as never, { lines: stream(90), label: 'The log', style: { blockSize: '120px' } }))
    await wait(60)
    expect(log.scrollTop).toBeCloseTo(log.scrollHeight - log.clientHeight, 0)
    expect(log.textContent).toContain('line 89')
  })

  it('lets go the moment the reader scrolls up, and never fights them for the scroll', async () => {
    const host = await mount(h(Log as never, { lines: stream(60), label: 'The log', style: { blockSize: '120px' } }))
    const log = host.querySelector<HTMLElement>('[data-scope="log"][data-part="root"]')!
    log.scrollTop = 0
    await wait(30)
    expect(log.dataset.following).toBe('false')

    root!.render(h(Log as never, { lines: stream(90), label: 'The log', style: { blockSize: '120px' } }))
    await wait(60)
    // The reader is still reading line 0: the arrival of thirty lines must not move them.
    expect(log.scrollTop).toBe(0)
    expect(log.dataset.following).toBe('false')
  })

  it('takes the tail back when the reader returns to the end themselves', async () => {
    const host = await mount(h(Log as never, { lines: stream(60), label: 'The log', style: { blockSize: '120px' } }))
    const log = host.querySelector<HTMLElement>('[data-scope="log"][data-part="root"]')!
    log.scrollTop = 0
    await wait(30)
    log.scrollTop = log.scrollHeight
    await wait(30)
    expect(log.dataset.following).toBe('true')

    root!.render(h(Log as never, { lines: stream(80), label: 'The log', style: { blockSize: '120px' } }))
    await wait(60)
    expect(log.scrollTop).toBeCloseTo(log.scrollHeight - log.clientHeight, 0)
  })

  it('keeps its columns aligned however long the level word is', async () => {
    const host = await mount(
      h(Log as never, {
        lines: [
          { id: 'a', level: 'info', time: '14:32:07', text: 'short' },
          { id: 'b', level: 'error', time: '14:32:08', text: 'long' },
        ],
        label: 'The log',
      })
    )
    const messages = [...host.querySelectorAll<HTMLElement>('[data-scope="log"][data-part="message"]')]
    expect(messages[0].getBoundingClientRect().left).toBeCloseTo(messages[1].getBoundingClientRect().left, 0)
  })
})

describe('diff', () => {
  const rows = [
    { kind: 'context' as const, text: 'const size = 256;', before: 41, after: 41 },
    { kind: 'del' as const, text: 'let seed = 0;', before: 42 },
    { kind: 'add' as const, text: 'let seed = Date.now();', after: 42 },
  ]

  it('copies clean code: no line numbers, and no plus or minus in the text', async () => {
    const host = await mount(h(Diff as never, { path: 'terrain/heightmap.ts', change: 'modified', rows }))
    const body = host.querySelector<HTMLElement>('[data-scope="diff"][data-part="body"]')!
    const range = document.createRange()
    range.selectNodeContents(body)
    const selection = getSelection()!
    selection.removeAllRanges()
    selection.addRange(range)
    const copied = selection.toString()
    selection.removeAllRanges()

    expect(copied).toContain('let seed = Date.now();')
    expect(copied).not.toContain('41')
    expect(copied).not.toContain('+')
    expect(copied).not.toContain('−')
  })

  it('draws the sign in the gutter, where colour is not the only carrier', async () => {
    const host = await mount(h(Diff as never, { path: 'a.ts', rows }))
    const added = host.querySelector<HTMLElement>('[data-part="row"][data-kind="add"]')!
    expect(getComputedStyle(added, '::before').content).toBe('"+"')
    const deleted = host.querySelector<HTMLElement>('[data-part="row"][data-kind="del"]')!
    expect(getComputedStyle(deleted, '::before').content).toBe('"−"')
  })

  it('does not wrap a long line: it scrolls, and the row keeps the frame’s width', async () => {
    const long = [{ kind: 'context' as const, text: 'x'.repeat(400), before: 1, after: 1 }]
    const host = await mount(h(Diff as never, { path: 'a.ts', rows: long }), 'inline-size: 320px')
    const body = host.querySelector<HTMLElement>('[data-scope="diff"][data-part="body"]')!
    const row = host.querySelector<HTMLElement>('[data-scope="diff"][data-part="row"]')!
    expect(body.scrollWidth).toBeGreaterThan(body.clientWidth)
    expect(row.getBoundingClientRect().height).toBeLessThan(40)
  })
})

describe('step', () => {
  it('is opened by find-in-page, which is the whole reason it is a details', async () => {
    const host = await mount(
      h(Step as never, { name: 'read_file', argument: 'a.ts', state: 'ok', output: 'the needle is in here' })
    )
    const step = host.querySelector<HTMLDetailsElement>('[data-scope="step"][data-part="root"]')!
    expect(step.open).toBe(false)
    // What the browser does on a match inside a closed `<details>`.
    expect(typeof step.querySelector('[data-part="body"]')).toBe('object')
    step.open = true
    await wait(20)
    expect(step.textContent).toContain('the needle is in here')
  })

  it('pushes the time to the far end and cuts the argument rather than the time', async () => {
    const host = await mount(
      h(Step as never, { name: 'read_file', argument: 'a/very/long/path/'.repeat(12) + 'file.ts', detail: '240 lines', duration: 1400, locale: 'en-GB' }),
      'inline-size: 360px'
    )
    const head = host.querySelector<HTMLElement>('[data-scope="step"][data-part="head"]')!.getBoundingClientRect()
    const meta = host.querySelector<HTMLElement>('[data-scope="step"][data-part="meta"]')!.getBoundingClientRect()
    expect(meta.right).toBeLessThanOrEqual(head.right + 1)
    expect(meta.width).toBeGreaterThan(0)
    const argument = host.querySelector<HTMLElement>('[data-scope="step"][data-part="argument"]')!
    expect(argument.scrollWidth).toBeGreaterThan(argument.clientWidth)
  })
})

describe('lanes', () => {
  it('measures every segment against one axis, whichever lane it is in', async () => {
    const host = await mount(
      h(Lanes as never, {
        label: 'Workers',
        locale: 'en-GB',
        lanes: [
          { id: 'a', label: 'a', spans: [{ label: 'x', start: 0, end: 5000, tone: 'ok' }] },
          { id: 'b', label: 'b', spans: [{ label: 'y', start: 5000, end: 10_000, tone: 'running' }] },
        ],
      })
    )
    const tracks = [...host.querySelectorAll<HTMLElement>('[data-scope="lanes"][data-part="track"]')]
    const spans = [...host.querySelectorAll<HTMLElement>('[data-scope="lanes"][data-part="span"]')]
    const width = tracks[0].getBoundingClientRect().width
    expect(tracks[1].getBoundingClientRect().width).toBeCloseTo(width, 0)
    expect(spans[0].getBoundingClientRect().width).toBeCloseTo(width / 2, 0)
    expect(spans[0].getBoundingClientRect().left).toBeCloseTo(tracks[0].getBoundingClientRect().left, 0)
    expect(spans[1].getBoundingClientRect().left).toBeCloseTo(tracks[1].getBoundingClientRect().left + width / 2, 0)
  })

  it('draws a stretch too short to see rather than dropping it', async () => {
    const host = await mount(
      h(Lanes as never, {
        label: 'Workers',
        lanes: [{ id: 'a', label: 'a', spans: [{ label: 'blink', start: 0, end: 1 }, { label: 'rest', start: 1, end: 100_000 }] }],
      })
    )
    const spans = [...host.querySelectorAll<HTMLElement>('[data-scope="lanes"][data-part="span"]')]
    expect(spans[0].getBoundingClientRect().width).toBeGreaterThanOrEqual(2)
  })
})
