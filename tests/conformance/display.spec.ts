import { describe, expect, it } from 'vitest'
import { type Adapter, freshTarget, part, parts } from './harness'

/**
 * The display components have no state, so the contract is the markup: the
 * parts a theme styles, the attributes that carry state, and what assistive
 * tech is told — which is where they differ between frameworks, if anywhere.
 */
export function displayConformance(adapter: Adapter) {
  describe('badge', () => {
    it('names a state with a word and repeats its tone as a hidden dot', async () => {
      const m = await adapter.badge({ label: 'Running', tone: 'running' }, freshTarget())
      const root = part(m.root, 'badge', 'root')!
      expect(root.dataset.tone).toBe('running')
      expect(root.dataset.variant).toBe('solid')
      expect(root.textContent).toBe('Running')
      expect(part(root, 'badge', 'dot')!.getAttribute('aria-hidden')).toBe('true')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('without a tone it is a plain label with no dot; a count never has one', async () => {
      const plain = await adapter.badge({ label: 'terrain_chunk_04' }, freshTarget())
      expect(part(plain.root, 'badge', 'root')!.hasAttribute('data-tone')).toBe(false)
      expect(part(plain.root, 'badge', 'dot')).toBeNull()
      const count = await adapter.badge({ label: '7', tone: 'ok', variant: 'count' }, freshTarget())
      expect(part(count.root, 'badge', 'dot')).toBeNull()
      expect(part(count.root, 'badge', 'root')!.dataset.variant).toBe('count')
    })

    it('follows a new tone', async () => {
      const m = await adapter.badge({ label: 'Done', tone: 'running' }, freshTarget())
      await m.update({ tone: 'ok' })
      expect(part(m.root, 'badge', 'root')!.dataset.tone).toBe('ok')
    })
  })

  describe('avatar', () => {
    it('is an image named by the name, drawn as initials', async () => {
      const m = await adapter.avatar({ name: 'Ada King Lovelace' }, freshTarget())
      const root = part(m.root, 'avatar', 'root')!
      expect(root.getAttribute('role')).toBe('img')
      expect(root.getAttribute('aria-label')).toBe('Ada King Lovelace')
      expect(root.dataset.size).toBe('md')
      const fallback = part(root, 'avatar', 'fallback')!
      expect(fallback.textContent).toBe('AL')
      expect(fallback.getAttribute('aria-hidden')).toBe('true')
      expect(part(root, 'avatar', 'image')).toBeNull()
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('initials come from letters in any script', async () => {
      const m = await adapter.avatar({ name: 'иннокентий соколов' }, freshTarget())
      expect(part(m.root, 'avatar', 'fallback')!.textContent).toBe('ИС')
    })

    it('with a picture, the image stands over the initials and carries no name of its own', async () => {
      const m = await adapter.avatar({ name: 'Ada Lovelace', src: '/avatar.png', size: 'lg' }, freshTarget())
      const image = part(m.root, 'avatar', 'image') as HTMLImageElement
      expect(image.getAttribute('alt')).toBe('')
      expect(part(m.root, 'avatar', 'fallback')!.textContent).toBe('AL')
      expect(part(m.root, 'avatar', 'root')!.dataset.size).toBe('lg')
    })

    // jsdom loads no images: the load and error events are the browser's.
    const inBrowser = typeof navigator !== 'undefined' && !navigator.userAgent.includes('jsdom')
    ;(inBrowser ? it : it.skip)('a picture that loads shows; one that fails leaves only the initials', async () => {
      const pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAMAASsJTYQAAAAASUVORK5CYII='
      const until = async (check: () => boolean) => {
        for (let i = 0; i < 200 && !check(); i++) await adapter.wait(10)
        expect(check()).toBe(true)
      }
      const m = await adapter.avatar({ name: 'Ada Lovelace', src: pixel }, freshTarget())
      const root = () => part(m.root, 'avatar', 'root')!
      await until(() => root().dataset.status === 'loaded')
      await m.update({ src: 'data:image/png;base64,broken' })
      await until(() => root().dataset.status === 'error')
      expect(part(m.root, 'avatar', 'image')).toBeNull()
      expect(part(m.root, 'avatar', 'fallback')!.textContent).toBe('AL')
    })

    it('decorative: hidden from assistive tech, the name beside it does the naming', async () => {
      const m = await adapter.avatar({ name: 'Ada Lovelace', decorative: true }, freshTarget())
      const root = part(m.root, 'avatar', 'root')!
      expect(root.getAttribute('aria-hidden')).toBe('true')
      expect(root.hasAttribute('role')).toBe(false)
      expect(root.hasAttribute('aria-label')).toBe(false)
    })

    it('a group is named, shows at most max, and counts the rest in text', async () => {
      const people = ['Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Edsger Dijkstra', 'Barbara Liskov'].map((name) => ({ name }))
      const m = await adapter.avatarGroup({ label: '5 participants', people, max: 2 }, freshTarget())
      const group = part(m.root, 'avatar', 'group')!
      expect(group.getAttribute('role')).toBe('group')
      expect(group.getAttribute('aria-label')).toBe('5 participants')
      expect(parts(group, 'avatar', 'root').map((el) => el.getAttribute('aria-label'))).toEqual(['Ada Lovelace', 'Alan Turing'])
      expect(part(group, 'avatar', 'more')!.textContent).toBe('+3')
      await m.update({ max: 5 })
      expect(parts(group, 'avatar', 'root')).toHaveLength(5)
      expect(part(group, 'avatar', 'more')).toBeNull()
    })
  })

  describe('spinner', () => {
    it('is a named status, drawn by two glyphs hidden from assistive tech', async () => {
      const m = await adapter.spinner({}, freshTarget())
      const root = part(m.root, 'spinner', 'root')!
      expect(root.getAttribute('role')).toBe('status')
      expect(root.getAttribute('aria-label')).toBe('Loading')
      expect(part(root, 'spinner', 'track')!.dataset.icon).toBe('spinner-track')
      expect(part(root, 'spinner', 'arc')!.dataset.icon).toBe('spinner-arc')
      expect(part(root, 'spinner', 'arc')!.getAttribute('aria-hidden')).toBe('true')
      await m.update({ label: 'Loading runs' })
      expect(root.getAttribute('aria-label')).toBe('Loading runs')
    })
  })

  describe('skeleton', () => {
    it('stands in for text as bars, hidden, the last of several short', async () => {
      const m = await adapter.skeleton({ lines: 3, title: true }, freshTarget())
      const root = part(m.root, 'skeleton', 'root')!
      expect(root.getAttribute('aria-hidden')).toBe('true')
      expect(parts(root, 'skeleton', 'bar').map((bar) => bar.dataset.shape)).toEqual(['title', 'line', 'line', 'short'])
      await m.update({ lines: 1, title: false })
      expect(parts(root, 'skeleton', 'bar').map((bar) => bar.dataset.shape)).toEqual(['line'])
    })
  })
}
