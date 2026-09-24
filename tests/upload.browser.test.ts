import { afterEach, describe, expect, it } from 'vitest'
import '../packages/theme-ggarry/src/index.css'
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Upload } from '../packages/react/src/index'
import type { UploadContext } from '../packages/core/src/components/upload'

/**
 * Upload where only a browser can say: a row's fill as wide as its progress,
 * a fill of unknown progress kept inside its row, the buttons in one column
 * down the list, tiles in a row with the zone a tile's size, and a real drop
 * listing a refused file instead of losing it.
 */

let root: Root | null = null
afterEach(() => {
  root?.unmount()
  root = null
  document.body.replaceChildren()
})

const frames = (count = 3) =>
  new Promise<void>((resolve) => {
    let left = count
    const tick = () => (--left <= 0 ? resolve() : requestAnimationFrame(tick))
    requestAnimationFrame(tick)
  })

/** Each file's name says what its upload does: `half` stops at 50%, `slow` never says how far, `done` is there. */
function fake(file: File, { onProgress }: UploadContext) {
  if (file.name.startsWith('done')) return Promise.resolve('key')
  if (file.name.startsWith('half')) onProgress(50, 100)
  return new Promise(() => {})
}

async function mount(props: Record<string, unknown> = {}) {
  const host = document.createElement('div')
  host.style.cssText = 'inline-size: 420px; padding: 16px'
  document.body.append(host)
  root = createRoot(host)
  root.render(createElement(Upload, { upload: fake, locale: 'en-GB', label: 'Drop files here', ...props }))
  while (!host.querySelector('[data-scope="file-drop"][data-part="root"]')) await frames(1)
  // Rendered is not listening: the zone's drop is attached in an effect after it.
  await frames(2)
  return host
}

function drop(host: HTMLElement, files: File[]) {
  const zone = host.querySelector<HTMLElement>('[data-scope="file-drop"][data-part="root"]')!
  const transfer = new DataTransfer()
  for (const file of files) transfer.items.add(file)
  zone.dispatchEvent(new DragEvent('dragenter', { bubbles: true, dataTransfer: transfer }))
  zone.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: transfer }))
}

const rowOf = (host: HTMLElement, name: string) =>
  [...host.querySelectorAll<HTMLElement>('[data-scope="upload"][data-part="item"]')].find((item) => item.querySelector('[data-part="name"]')!.textContent === name)!

describe('upload', () => {
  it('a row’s fill is as wide as its progress, from the start edge; an unknown one stays inside its row', async () => {
    const host = await mount()
    drop(host, [new File(['x'], 'half.pdf'), new File(['x'], 'slow.pdf')])
    await frames(4)
    const half = rowOf(host, 'half.pdf').getBoundingClientRect()
    const fill = getComputedStyle(rowOf(host, 'half.pdf').querySelector('[data-part="progress"]')!)
    expect(fill.backgroundSize.split(' ')[0]).toBe('50%')
    expect(rowOf(host, 'half.pdf').querySelector('[data-part="progress"]')!.getBoundingClientRect().width).toBeCloseTo(half.width - 2, 0)
    // The unknown one's piece is painted inside the progress part, which is the row's own box.
    const slow = rowOf(host, 'slow.pdf')
    const piece = slow.querySelector<HTMLElement>('[data-part="progress"]')!.getBoundingClientRect()
    const box = slow.getBoundingClientRect()
    expect(piece.left).toBeGreaterThanOrEqual(box.left)
    expect(piece.right).toBeLessThanOrEqual(box.right)
  })

  it('the buttons stand in one column down the list, whatever else a row has', async () => {
    const host = await mount({ accept: '.pdf' })
    drop(host, [new File(['x'], 'half.pdf'), new File(['x'], 'done.pdf'), new File(['x'], 'notes.txt', { type: 'text/plain' })])
    await frames(4)
    const ends = ['half.pdf', 'done.pdf', 'notes.txt'].map((name) => rowOf(host, name).querySelector('[data-part="action"]:last-child')!.getBoundingClientRect().right)
    expect(Math.max(...ends) - Math.min(...ends)).toBeLessThan(1)
    const heights = ['half.pdf', 'done.pdf'].map((name) => rowOf(host, name).getBoundingClientRect().height)
    expect(heights[0]).toBe(heights[1])
  })

  it('a real drop lists a file the accept list refuses, with the reason, instead of losing it', async () => {
    const host = await mount({ accept: 'image/*' })
    drop(host, [new File(['x'], 'notes.txt', { type: 'text/plain' })])
    await frames(2)
    expect(rowOf(host, 'notes.txt').dataset.status).toBe('error')
    expect(rowOf(host, 'notes.txt').querySelector('[data-part="meta"]')!.textContent).toBe('Not a type this takes')
  })

  it('as tiles: squares in a row that wraps, the zone the last square at a tile’s size, a chosen image drawn', async () => {
    const host = await mount({ view: 'tiles', accept: 'image/*', hint: 'Up to 5 MB' })
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 20
    const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'))
    drop(host, [0, 1, 2, 3].map((n) => new File([blob], `done-${n}.png`, { type: 'image/png' })))
    await frames(6)
    const tiles = [...host.querySelectorAll<HTMLElement>('[data-scope="upload"][data-part="item"]')]
    const squares = tiles.map((tile) => tile.querySelector<HTMLElement>('[data-part="preview"]')!.getBoundingClientRect())
    expect(squares.every((square) => Math.abs(square.width - square.height) < 1 && square.width > 80)).toBe(true)
    expect(Math.abs(squares[1].top - squares[0].top)).toBeLessThan(1)
    expect(squares[3].top).toBeGreaterThan(squares[0].bottom)
    const zone = host.querySelector<HTMLElement>('[data-scope="file-drop"][data-part="root"]')!.getBoundingClientRect()
    expect(Math.abs(zone.width - squares[0].width)).toBeLessThan(1)
    expect(Math.abs(zone.height - squares[0].height)).toBeLessThan(1)
    const hint = host.querySelector<HTMLElement>('[data-scope="upload"][data-part="hint"]')!.getBoundingClientRect()
    expect(hint.top).toBeGreaterThan(Math.max(zone.bottom, squares[3].bottom) - 1)
  })
})
