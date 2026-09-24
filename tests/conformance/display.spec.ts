import { describe, expect, it } from 'vitest'
import { vi } from 'vitest'
import { type Adapter, click, freshTarget, part, parts } from './harness'

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
      expect(root.dataset.emphasis).toBe('medium')
      expect(root.textContent).toBe('Running')
      expect(part(root, 'badge', 'dot')!.getAttribute('aria-hidden')).toBe('true')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('without a tone it is a plain label with no dot; a count never has one', async () => {
      const plain = await adapter.badge({ label: 'terrain_chunk_04' }, freshTarget())
      expect(part(plain.root, 'badge', 'root')!.hasAttribute('data-tone')).toBe(false)
      expect(part(plain.root, 'badge', 'dot')).toBeNull()
      const count = await adapter.badge({ label: '7', tone: 'ok', count: true }, freshTarget())
      expect(part(count.root, 'badge', 'dot')).toBeNull()
      expect(part(count.root, 'badge', 'root')!.hasAttribute('data-count')).toBe(true)
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

  describe('card', () => {
    it('is a region with a heading, level 3 by default, and a caption', async () => {
      const m = await adapter.card({ title: 'worldbox-1', subtitle: 'Queued 2 min ago', rank: 'support', tone: 'warn', plain: true }, freshTarget())
      const root = part(m.root, 'card', 'root')!
      expect(root.localName).not.toBe('a')
      expect(root.dataset.rank).toBe('support')
      expect(root.dataset.tone).toBe('warn')
      expect(root.hasAttribute('data-plain')).toBe(true)
      const title = part(root, 'card', 'title')!
      expect(title.localName).toBe('h3')
      expect(title.textContent).toBe('worldbox-1')
      expect(part(root, 'card', 'subtitle')!.textContent).toBe('Queued 2 min ago')
      expect(root.textContent).toContain('Body')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('takes the heading level it is given, and none without a title', async () => {
      const m = await adapter.card({ title: 'Run', headingLevel: 2 }, freshTarget())
      expect(part(m.root, 'card', 'title')!.localName).toBe('h2')
      const bare = await adapter.card({}, freshTarget())
      expect(part(bare.root, 'card', 'header')).toBeNull()
    })

    ;(adapter.supports.linkRoot ? it : it.skip)('a link card is itself the link', async () => {
      const m = await adapter.card({ href: '#run' }, freshTarget())
      const root = part(m.root, 'card', 'root')!
      expect(root.localName).toBe('a')
      expect(root.getAttribute('href')).toBe('#run')
      expect(root.hasAttribute('data-interactive')).toBe(true)
      expect(root.querySelector('a')).toBeNull()
    })
  })

  describe('panel', () => {
    it('has a header with a level-2 title and actions, and a body', async () => {
      const m = await adapter.panel({ title: 'Runs', actions: true, body: 'flush' }, freshTarget())
      const root = part(m.root, 'panel', 'root')!
      const header = part(root, 'panel', 'header')!
      expect(part(header, 'panel', 'title')!.localName).toBe('h2')
      expect(part(header, 'panel', 'title')!.textContent).toBe('Runs')
      expect(part(header, 'panel', 'actions')!.textContent).toBe('Refresh')
      const body = part(root, 'panel', 'body')!
      expect(body.dataset.body).toBe('flush')
      expect(body.textContent).toBe('Body')
      expect(root.hasAttribute('role')).toBe(false)
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('as a landmark it is a region named by its title; a scrolling body is reachable by keyboard', async () => {
      const m = await adapter.panel({ title: 'Log', region: true, scrollable: true }, freshTarget())
      const root = part(m.root, 'panel', 'root')!
      const title = part(root, 'panel', 'title')!
      expect(root.getAttribute('role')).toBe('region')
      expect(root.getAttribute('aria-labelledby')).toBe(title.id)
      const body = part(root, 'panel', 'body')!
      expect(body.tabIndex).toBe(0)
      expect(body.getAttribute('aria-labelledby')).toBe(title.id)
    })
  })

  describe('banner', () => {
    it('carries a tone icon, a title, its detail and its actions', async () => {
      const m = await adapter.banner({ tone: 'warn', title: 'Access expires in 3 days', text: 'Renew before Friday.', actions: true }, freshTarget())
      const root = part(m.root, 'banner', 'root')!
      expect(root.dataset.tone).toBe('warn')
      expect(part(root, 'banner', 'icon')!.dataset.icon).toBe('status-warn')
      expect(part(root, 'banner', 'icon')!.getAttribute('aria-hidden')).toBe('true')
      expect(part(root, 'banner', 'title')!.textContent).toBe('Access expires in 3 days')
      expect(part(root, 'banner', 'text')!.textContent).toBe('Renew before Friday.')
      expect(part(root, 'banner', 'actions')!.textContent).toBe('Renew')
      expect(part(root, 'banner', 'close')).toBeNull()
      expect(root.hasAttribute('role')).toBe(false)
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('without a tone there is no icon; live says it as it appears', async () => {
      const plain = await adapter.banner({ title: 'Maintenance tonight' }, freshTarget())
      expect(part(plain.root, 'banner', 'icon')).toBeNull()
      const alert = await adapter.banner({ tone: 'error', title: 'Could not save', live: 'alert' }, freshTarget())
      expect(part(alert.root, 'banner', 'root')!.getAttribute('role')).toBe('alert')
      const polite = await adapter.banner({ title: 'Saved', live: 'polite' }, freshTarget())
      expect(part(polite.root, 'banner', 'root')!.getAttribute('aria-live')).toBe('polite')
    })

    it('a dismissible banner has a named close button that asks the owner', async () => {
      const onDismiss = vi.fn()
      const m = await adapter.banner({ title: 'New version', onDismiss, dismissLabel: 'Hide the notice' }, freshTarget())
      const close = part(m.root, 'banner', 'close')!
      expect(close.getAttribute('aria-label')).toBe('Hide the notice')
      expect(part(close, 'banner', 'close-icon')!.dataset.icon).toBe('close')
      await adapter.act(() => click(close))
      expect(onDismiss).toHaveBeenCalledTimes(1)
    })
  })

  describe('note', () => {
    it('is an aside with a tone icon, or a bare one without', async () => {
      const m = await adapter.note({ text: 'The model is being retired.', tone: 'warn', live: 'polite' }, freshTarget())
      const root = part(m.root, 'note', 'root')!
      expect(part(root, 'note', 'icon')!.dataset.icon).toBe('status-warn')
      expect(part(root, 'note', 'body')!.textContent).toBe('The model is being retired.')
      expect(root.getAttribute('aria-live')).toBe('polite')
      await m.update({ tone: undefined })
      expect(part(root, 'note', 'icon')).toBeNull()
      expect(m.root.querySelector('[class]')).toBeNull()
    })
  })

  describe('empty state', () => {
    it('says why and offers the next step; the title is text unless given a level', async () => {
      const m = await adapter.emptyState({ title: 'No runs yet', description: 'Runs you start appear here.', action: 'Start a run' }, freshTarget())
      const root = part(m.root, 'empty-state', 'root')!
      expect(part(root, 'empty-state', 'title')!.localName).toBe('p')
      expect(part(root, 'empty-state', 'title')!.textContent).toBe('No runs yet')
      expect(part(root, 'empty-state', 'description')!.textContent).toBe('Runs you start appear here.')
      expect(part(root, 'empty-state', 'actions')!.textContent).toBe('Start a run')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('filling a region: a real heading, announced when a filter empties it', async () => {
      const m = await adapter.emptyState({ title: 'Nothing matches “worldgen”', headingLevel: 2, live: 'polite' }, freshTarget())
      const root = part(m.root, 'empty-state', 'root')!
      expect(part(root, 'empty-state', 'title')!.localName).toBe('h2')
      expect(root.getAttribute('aria-live')).toBe('polite')
      expect(part(root, 'empty-state', 'actions')).toBeNull()
      expect(part(root, 'empty-state', 'description')).toBeNull()
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
