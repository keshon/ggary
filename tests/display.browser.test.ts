import { afterEach, describe, expect, it } from 'vitest'
import { createElement as h } from 'react'
import { flushSync } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'
import '../packages/structure/src/index.css'
import { Avatar } from '../packages/react/src/index'

/**
 * What only a browser answers about the display components: an avatar's image
 * really loading or failing, and the initials staying until it has loaded.
 */
let root: Root | null = null
afterEach(() => {
  root?.unmount()
  root = null
  document.body.replaceChildren()
})

// A 1×1 PNG.
const PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAMAASsJTYQAAAAASUVORK5CYII='

const until = async (check: () => boolean, ms = 2000) => {
  const start = performance.now()
  while (!check()) {
    if (performance.now() - start > ms) throw new Error('timed out')
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
}

const mount = (name: string, src: string) => {
  const host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  // Committed at once: the first frame is the one measured, before any load or failure arrives.
  flushSync(() => root!.render(h(Avatar, { name, src })))
  return host
}

const avatar = (host: Element) => host.querySelector<HTMLElement>('[data-scope="avatar"][data-part="root"]')

describe('avatar in a real browser', () => {
  it('shows the picture once it has loaded, over the initials', async () => {
    const host = mount('Ada Lovelace', PIXEL)
    await until(() => avatar(host)?.getAttribute('data-status') === 'loaded')
    const image = avatar(host)!.querySelector('[data-part="image"]') as HTMLImageElement
    expect(getComputedStyle(image).visibility).toBe('visible')
    expect(avatar(host)!.querySelector('[data-part="fallback"]')!.textContent).toBe('AL')
  })

  it('a picture that fails leaves the initials, and no broken image', async () => {
    const host = mount('Alan Turing', 'data:image/png;base64,broken')
    await until(() => avatar(host)?.getAttribute('data-status') === 'error')
    expect(avatar(host)!.querySelector('[data-part="image"]')).toBeNull()
    expect(avatar(host)!.querySelector('[data-part="fallback"]')!.textContent).toBe('AT')
  })

  it('while the picture loads, it is not drawn', () => {
    const host = mount('Grace Hopper', '/never-arrives.png')
    const image = host.querySelector('[data-part="image"]')!
    expect(getComputedStyle(image).visibility).toBe('hidden')
  })
})
