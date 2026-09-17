import { afterEach, describe, expect, it } from 'vitest'
import '../packages/structure/src/index.css'
import '../packages/elements/src/index'

/**
 * What only a browser answers about the display components: an avatar's image
 * really loading or failing, and the initials staying until it has loaded.
 */
afterEach(() => {
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

describe('avatar in a real browser', () => {
  it('shows the picture once it has loaded, over the initials', async () => {
    document.body.innerHTML = `<gg-avatar name="Ada Lovelace" src="${PIXEL}"></gg-avatar>`
    const avatar = document.querySelector('gg-avatar')!
    await until(() => avatar.getAttribute('data-status') === 'loaded')
    const image = avatar.querySelector('[data-part="image"]') as HTMLImageElement
    expect(getComputedStyle(image).visibility).toBe('visible')
    expect(avatar.querySelector('[data-part="fallback"]')!.textContent).toBe('AL')
  })

  it('a picture that fails leaves the initials, and no broken image', async () => {
    document.body.innerHTML = `<gg-avatar name="Alan Turing" src="data:image/png;base64,broken"></gg-avatar>`
    const avatar = document.querySelector('gg-avatar')!
    await until(() => avatar.getAttribute('data-status') === 'error')
    expect(avatar.querySelector('[data-part="image"]')).toBeNull()
    expect(avatar.querySelector('[data-part="fallback"]')!.textContent).toBe('AT')
  })

  it('while the picture loads, it is not drawn', () => {
    document.body.innerHTML = `<gg-avatar name="Grace Hopper" src="/never-arrives.png"></gg-avatar>`
    const image = document.querySelector('[data-part="image"]')!
    expect(getComputedStyle(image).visibility).toBe('hidden')
  })
})
