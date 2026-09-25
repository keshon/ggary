import { describe, expect, it, vi } from 'vitest'
import { type Adapter, type AnchorProps, click, freshTarget, keydown, part } from './harness'

const sections: AnchorProps['items'] = [
  { label: 'Variants', href: '#variants' },
  { label: 'States', href: '#states', items: [{ label: 'Loading', href: '#loading' }, { label: 'Empty', href: '#empty' }] },
  { label: 'Composition', href: '#composition' },
]

export function anchorConformance(adapter: Adapter) {
  describe('anchor', () => {
    const setup = async (props: Partial<AnchorProps> = {}) => {
      const m = await adapter.anchor({ label: 'On this page', items: sections, ...props }, freshTarget())
      const root = () => part(m.root, 'anchor', 'root')!
      const links = () => [...m.root.querySelectorAll('[data-scope="anchor"][data-part="link"]')] as HTMLAnchorElement[]
      const trigger = () => part(m.root, 'anchor', 'trigger') as HTMLButtonElement | null
      const panel = () => part(m.root, 'anchor', 'panel')!
      return { m, root, links, trigger, panel }
    }

    it('is a named landmark of real links to the sections, one level of sections within', async () => {
      const { m, root, links } = await setup()
      expect(root().tagName).toBe('NAV')
      expect(root().getAttribute('aria-label')).toBe('On this page')
      expect(links().map((link) => link.getAttribute('href'))).toEqual(['#variants', '#states', '#loading', '#empty', '#composition'])
      const lists = [...m.root.querySelectorAll('[data-scope="anchor"][data-part="list"]')] as HTMLElement[]
      expect(lists.map((list) => [list.tagName, list.dataset.level])).toEqual([['UL', '1'], ['UL', '2']])
      expect(links()[2].dataset.level).toBe('2')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('marks the section being read in the markup, the first before any is', async () => {
      const { m, links } = await setup()
      expect(links()[0].getAttribute('aria-current')).toBe('location')
      await m.update({ current: '#loading' })
      expect(links().map((link) => link.getAttribute('aria-current'))).toEqual([null, null, 'location', null, null])
      expect(links()[2].dataset.current).toBe('')
    })

    it('a link followed becomes the one read, and says so', async () => {
      const onCurrentChange = vi.fn()
      const { links } = await setup({ onCurrentChange })
      await adapter.act(() => click(links()[4]))
      expect(onCurrentChange).toHaveBeenLastCalledWith('#composition')
      expect(links()[4].getAttribute('aria-current')).toBe('location')
    })

    it('stands where it is put by default: no button, the list shown', async () => {
      const { root, trigger, panel } = await setup()
      expect(trigger()).toBeNull()
      expect(root().hasAttribute('data-floating')).toBe(false)
      expect(panel().hidden).toBe(false)
    })

    it('folded, a button names the section being read and opens the list', async () => {
      const onOpenChange = vi.fn()
      const { root, trigger, panel } = await setup({ float: true, current: '#states', onOpenChange })
      expect(root().dataset.floating).toBe('')
      expect(panel().hidden).toBe(true)
      expect(trigger()!.textContent).toBe('States')
      expect(trigger()!.getAttribute('aria-label')).toBe('On this page: States')
      expect(trigger()!.getAttribute('aria-expanded')).toBe('false')
      expect(trigger()!.getAttribute('aria-controls')).toBe(panel().id)
      expect(part(trigger()!, 'anchor', 'trigger-icon')!.dataset.icon).toBe('list')
      await adapter.act(() => click(trigger()!))
      expect(onOpenChange).toHaveBeenLastCalledWith(true)
      expect(panel().hidden).toBe(false)
      expect(trigger()!.getAttribute('aria-expanded')).toBe('true')
      expect(root().dataset.state).toBe('open')
    })

    it('folded and open, a link followed closes the list', async () => {
      const { links, panel } = await setup({ float: true, defaultOpen: true })
      expect(panel().hidden).toBe(false)
      await adapter.act(() => click(links()[1]))
      expect(panel().hidden).toBe(true)
    })

    it('folded and open, Escape closes the list and gives the focus back to the button', async () => {
      const { links, panel, trigger } = await setup({ float: true, defaultOpen: true })
      links()[0].focus()
      await adapter.act(() => keydown(links()[0], 'Escape'))
      expect(panel().hidden).toBe(true)
      expect(document.activeElement).toBe(trigger())
    })

    it('an owner who holds `open` decides', async () => {
      const onOpenChange = vi.fn()
      const { m, trigger, panel } = await setup({ float: true, open: false, onOpenChange })
      await adapter.act(() => click(trigger()!))
      expect(onOpenChange).toHaveBeenLastCalledWith(true)
      if (adapter.supports.refusal) expect(panel().hidden).toBe(true)
      await m.update({ open: true })
      expect(panel().hidden).toBe(false)
    })

    it('a width in `float` folds it only below that width', async () => {
      const { root, trigger } = await setup({ float: 1 })
      expect(root().hasAttribute('data-floating')).toBe(false)
      expect(trigger()).toBeNull()
    })
  })
}
