import { describe, expect, it, vi } from 'vitest'
import type { TabItem } from '../../packages/core/src/components/tabs'
import { type Adapter, type TabsProps, click, freshTarget, keydown, part, parts } from './harness'

const sections: TabItem[] = [
  { value: 'geometry', label: 'Geometry' },
  { value: 'material', label: 'Material' },
  { value: 'physics', label: 'Physics', disabled: true },
  { value: 'scripts', label: 'Scripts' },
]

const documents: TabItem[] = [
  { value: 'tokens.css', label: 'tokens.css', closable: true },
  { value: 'layout.css', label: 'layout.css', closable: true, modified: true },
  { value: 'components.css', label: 'components.css', closable: true },
]

/**
 * Tabs (WAI-ARIA APG): a tab list with one tab stop, panels wired to their
 * tabs, arrows that move and select, and closable tabs for open documents.
 */
export function tabsConformance(adapter: Adapter) {
  describe('tabs', () => {
    const setup = async (props: Partial<TabsProps> = {}) => {
      const m = await adapter.tabs({ items: sections, label: 'Object properties', ...props }, freshTarget())
      const tab = (label: string) => parts(m.root, 'tabs', 'tab').find((el) => part(el, 'tabs', 'tab-text')!.textContent === label)!
      const shownPanels = () => parts(m.root, 'tabs', 'panel').filter((el) => !el.hidden)
      return {
        m,
        list: () => part(m.root, 'tabs', 'list')!,
        tabs: () => parts(m.root, 'tabs', 'tab'),
        tab,
        shownPanels,
        focused: () => (document.activeElement ? part(document.activeElement, 'tabs', 'tab-text')?.textContent : undefined),
        key: (k: string) => adapter.act(() => keydown(document.activeElement ?? document.body, k)),
        press: (el: Element) => adapter.act(() => click(el)),
      }
    }

    describe('anatomy', () => {
      it('is a named tab list whose tabs control their panels, with the selected panel alone shown', async () => {
        const { m, list, tabs, tab, shownPanels } = await setup()
        expect(list().getAttribute('role')).toBe('tablist')
        expect(list().getAttribute('aria-label')).toBe('Object properties')
        expect(tabs().map((el) => el.getAttribute('role'))).toEqual(['tab', 'tab', 'tab', 'tab'])
        expect(tabs().map((el) => el.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false', 'false'])
        expect(tab('Physics').getAttribute('aria-disabled')).toBe('true')

        const panel = document.getElementById(tab('Geometry').getAttribute('aria-controls')!)!
        expect(panel.getAttribute('role')).toBe('tabpanel')
        expect(panel.getAttribute('aria-labelledby')).toBe(tab('Geometry').id)
        expect(shownPanels()).toEqual([panel])
        expect(panel.textContent?.trim()).toBe('Panel Geometry')
        expect(m.root.querySelector('[class]')).toBeNull()
      })

      it('has one tab stop, on the selected tab', async () => {
        const { tabs } = await setup({ defaultValue: 'material' })
        expect(tabs().map((el) => el.tabIndex)).toEqual([-1, 0, -1, -1])
      })

      it('without panels, the tabs point at nothing', async () => {
        const { m, tab } = await setup({ panels: false })
        expect(parts(m.root, 'tabs', 'panel')).toHaveLength(0)
        expect(tab('Geometry').hasAttribute('aria-controls')).toBe(false)
      })
    })

    describe('selecting', () => {
      it('a press selects and shows its panel, and reports it; a disabled tab does nothing', async () => {
        const onValueChange = vi.fn()
        const { tab, shownPanels, press } = await setup({ onValueChange })
        await press(tab('Scripts'))
        expect(tab('Scripts').getAttribute('aria-selected')).toBe('true')
        expect(tab('Scripts').dataset.state).toBe('active')
        expect(shownPanels().map((el) => el.textContent?.trim())).toEqual(['Panel Scripts'])
        expect(onValueChange).toHaveBeenLastCalledWith('scripts')
        await press(tab('Physics'))
        expect(tab('Physics').getAttribute('aria-selected')).toBe('false')
        expect(onValueChange).toHaveBeenCalledTimes(1)
      })

      it('the arrows move focus and select, skipping disabled tabs and wrapping; Home and End jump', async () => {
        const { tab, tabs, focused, key } = await setup()
        await adapter.act(() => tab('Geometry').focus())
        await key('ArrowRight')
        expect(focused()).toBe('Material')
        expect(tab('Material').getAttribute('aria-selected')).toBe('true')
        await key('ArrowRight')
        expect(focused()).toBe('Scripts')
        await key('ArrowRight')
        expect(focused()).toBe('Geometry')
        await key('ArrowLeft')
        expect(focused()).toBe('Scripts')
        await key('Home')
        expect(focused()).toBe('Geometry')
        await key('End')
        expect(focused()).toBe('Scripts')
        expect(tabs().map((el) => el.tabIndex)).toEqual([-1, -1, -1, 0])
      })

      it('manual activation: the arrows move focus only, Enter selects', async () => {
        const { tab, focused, key } = await setup({ activation: 'manual' })
        await adapter.act(() => tab('Geometry').focus())
        await key('ArrowRight')
        expect(focused()).toBe('Material')
        expect(tab('Geometry').getAttribute('aria-selected')).toBe('true')
        await key('Enter')
        expect(tab('Material').getAttribute('aria-selected')).toBe('true')
      })

      it('vertical: says so, and walks with ArrowDown and ArrowUp', async () => {
        const { list, tab, focused, key } = await setup({ orientation: 'vertical' })
        expect(list().getAttribute('aria-orientation')).toBe('vertical')
        await adapter.act(() => tab('Geometry').focus())
        await key('ArrowRight')
        expect(focused()).toBe('Geometry')
        await key('ArrowDown')
        expect(focused()).toBe('Material')
      })

      it('follows a value pushed by the owner, without reporting it', async () => {
        const onValueChange = vi.fn()
        const { m, tab } = await setup({ value: 'geometry', onValueChange })
        await m.update({ value: 'scripts' })
        expect(tab('Scripts').getAttribute('aria-selected')).toBe('true')
        expect(onValueChange).not.toHaveBeenCalled()
      })

      const refusal = adapter.supports.refusal ? it : it.skip
      refusal('controlled: reports the press but shows the owner\'s tab', async () => {
        const onValueChange = vi.fn()
        const { tab, press } = await setup({ value: 'geometry', onValueChange })
        await press(tab('Material'))
        expect(onValueChange).toHaveBeenCalledWith('material')
        expect(tab('Geometry').getAttribute('aria-selected')).toBe('true')
      })
    })

    describe('closable tabs', () => {
      it('a closable tab carries a named close button out of the tab order; a modified one is marked', async () => {
        const { tab } = await setup({ items: documents, variant: 'chips' })
        const close = part(tab('tokens.css'), 'tabs', 'close')!
        expect(close.localName).toBe('button')
        expect(close.getAttribute('aria-label')).toBe('Close tokens.css')
        expect(close.tabIndex).toBe(-1)
        expect(part(close, 'tabs', 'close-icon')!.dataset.icon).toBe('close')
        expect(tab('layout.css').hasAttribute('data-modified')).toBe(true)
        expect(part(tab('layout.css').closest('[data-part="root"]')!, 'tabs', 'list')!.dataset.variant).toBe('chips')
      })

      it('the close button asks to close without selecting; Delete and a middle click ask too', async () => {
        const onClose = vi.fn()
        const onValueChange = vi.fn()
        const { tab, key, press } = await setup({ items: documents, onClose, onValueChange })
        await press(part(tab('components.css'), 'tabs', 'close')!)
        expect(onClose).toHaveBeenLastCalledWith('components.css')
        expect(onValueChange).not.toHaveBeenCalled()
        await adapter.act(() => tab('tokens.css').focus())
        await key('Delete')
        expect(onClose).toHaveBeenLastCalledWith('tokens.css')
        await adapter.act(() => {
          tab('layout.css').dispatchEvent(new MouseEvent('auxclick', { button: 1, bubbles: true, cancelable: true }))
        })
        expect(onClose).toHaveBeenLastCalledWith('layout.css')
        expect(onClose).toHaveBeenCalledTimes(3)
      })

      it('when the owner closes the selected, focused tab, its neighbour is selected, shown and focused', async () => {
        const onValueChange = vi.fn()
        const { m, tab, focused, shownPanels, key } = await setup({
          items: documents,
          defaultValue: 'layout.css',
          onValueChange,
          onClose: (value) => void m.update({ items: documents.filter((item) => item.value !== value) }),
        })
        await adapter.act(() => tab('layout.css').focus())
        await key('Delete')
        await adapter.act(() => {})
        expect(parts(m.root, 'tabs', 'tab')).toHaveLength(2)
        expect(tab('components.css').getAttribute('aria-selected')).toBe('true')
        expect(shownPanels().map((el) => el.textContent?.trim())).toEqual(['Panel components.css'])
        expect(onValueChange).toHaveBeenLastCalledWith('components.css')
        expect(focused()).toBe('components.css')
      })
    })
  })
}
