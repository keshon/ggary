import { describe, expect, it } from 'vitest'
import { type Adapter, freshTarget, part } from './harness'

/**
 * Typography: a Text is one element, the most meaningful of what was asked;
 * a Link says where it goes when it leaves; Prose styles what it is given and
 * adds nothing to it.
 */
export function typographyConformance(adapter: Adapter) {
  describe('text', () => {
    it('is a span in the ink around it, and says every asked-for way as an attribute', async () => {
      const m = await adapter.text({ text: 'Updated 3 min ago' }, freshTarget())
      const root = part(m.root, 'text', 'root')!
      expect(root.tagName).toBe('SPAN')
      expect(root.dataset.emphasis).toBe('medium')
      expect(root.hasAttribute('data-tone')).toBe(false)
      expect(root.textContent).toBe('Updated 3 min ago')
      await m.update({ emphasis: 'low', tone: 'error' })
      expect(root.dataset.emphasis).toBe('low')
      expect(root.dataset.tone).toBe('error')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('is the most meaningful element asked for, and the rest are attributes on it', async () => {
      const cases: [Record<string, boolean>, string][] = [
        [{ strong: true }, 'STRONG'],
        [{ code: true }, 'CODE'],
        [{ kbd: true }, 'KBD'],
        [{ mark: true }, 'MARK'],
        [{ deleted: true }, 'DEL'],
        [{ strong: true, code: true }, 'CODE'],
      ]
      for (const [ways, tag] of cases) {
        const m = await adapter.text({ text: 'x', ...ways }, freshTarget())
        const root = part(m.root, 'text', 'root')!
        expect(root.tagName, JSON.stringify(ways)).toBe(tag)
        for (const way of Object.keys(ways)) expect(root.hasAttribute(`data-${way}`), way).toBe(true)
      }
    })

    it('is cut to one line, or to a count of lines it hands the stylesheet', async () => {
      const one = await adapter.text({ text: 'A long description', truncate: true }, freshTarget())
      expect(part(one.root, 'text', 'root')!.dataset.truncate).toBe('line')
      const three = await adapter.text({ text: 'A long description', truncate: 3 }, freshTarget())
      const root = part(three.root, 'text', 'root')!
      expect(root.dataset.truncate).toBe('lines')
      expect(root.style.getPropertyValue('--gg-text-lines')).toBe('3')
    })
  })

  describe('link', () => {
    it('is an anchor to where it points, and stays in this tab', async () => {
      const m = await adapter.link({ text: 'Docs', href: '/docs' }, freshTarget())
      const root = part(m.root, 'link', 'root') as HTMLAnchorElement
      expect(root.tagName).toBe('A')
      expect(root.getAttribute('href')).toBe('/docs')
      expect(root.hasAttribute('target')).toBe(false)
      expect(root.textContent).toBe('Docs')
      expect(part(root, 'link', 'icon')).toBeNull()
    })

    it('opens an external one in a new tab it cannot reach back from, and says so in words', async () => {
      const m = await adapter.link({ text: 'GitHub', href: 'https://github.com', external: true }, freshTarget())
      const root = part(m.root, 'link', 'root') as HTMLAnchorElement
      expect(root.getAttribute('target')).toBe('_blank')
      expect(root.getAttribute('rel')).toBe('noopener noreferrer')
      expect(part(root, 'link', 'icon')!.getAttribute('aria-hidden')).toBe('true')
      expect(part(root, 'link', 'hint')!.textContent).toBe('(opens in a new tab)')
      expect(root.textContent).toBe('GitHub(opens in a new tab)')
      await m.update({ words: { external: '(в новой вкладке)' } })
      expect(part(root, 'link', 'hint')!.textContent).toBe('(в новой вкладке)')
    })
  })

  describe('prose', () => {
    it('holds authored HTML as it is given, at a size', async () => {
      const html = '<h2>Setup</h2><p>Run <code>npm install</code>, then <a href="/next">continue</a>.</p><ul><li>one</li></ul>'
      const m = await adapter.prose({ html }, freshTarget())
      const root = part(m.root, 'prose', 'root')!
      expect(root.dataset.size).toBe('md')
      expect(root.querySelector('h2')!.textContent).toBe('Setup')
      expect(root.querySelector('code')!.textContent).toBe('npm install')
      expect(root.querySelector('a')!.getAttribute('href')).toBe('/next')
      expect(root.querySelectorAll('li')).toHaveLength(1)
      await m.update({ size: 'sm' })
      expect(root.dataset.size).toBe('sm')
    })
  })
}
