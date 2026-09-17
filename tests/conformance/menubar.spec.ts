import { describe, expect, it, vi } from 'vitest'
import type { MenubarMenu } from '../../packages/core/src/components/menubar'
import { openLayerCount } from '../../packages/core/src/utils/dismissable'
import { type Adapter, type MenubarProps, click, freshTarget, keydown, part, parts } from './harness'

/** In a browser, the platform says; under jsdom, the shim keeps the answer. */
const shownInTopLayer = (el: Element) => {
  const shim = (globalThis as { isPopoverOpen?: (el: Element) => boolean }).isPopoverOpen
  return shim ? shim(el) : el.matches(':popover-open')
}

const menus: MenubarMenu[] = [
  {
    value: 'file',
    label: '&File',
    items: [
      { value: 'new', label: 'New', shortcut: 'Ctrl+N' },
      { type: 'submenu', value: 'recent', label: 'Open Recent', items: [{ value: 'a', label: 'a.txt' }, { value: 'b', label: 'b.txt' }] },
      { type: 'separator' },
      { value: 'quit', label: 'Quit' },
    ],
  },
  { value: 'edit', label: '&Edit', items: [{ value: 'undo', label: 'Undo' }, { value: 'redo', label: 'Redo' }] },
  { value: 'tools', label: '&Tools', disabled: true, items: [{ value: 'lint', label: 'Lint' }] },
  { value: 'help', label: '&Help', items: [{ value: 'about', label: 'About' }] },
]

/**
 * Menubar: a row of menus with one tab stop (WAI-ARIA APG menubar). The bar
 * walks with arrows; an open menu is the Menu, anchored to its bar item; the
 * keyboard and the pointer move between open menus directly.
 */
export function menubarConformance(adapter: Adapter) {
  describe('menubar', () => {
    const setup = async (props: Partial<MenubarProps> = {}) => {
      const m = await adapter.menubar({ menus, label: 'Application', ...props }, freshTarget())
      const bar = () => part(m.root, 'menubar', 'root')!
      const barItems = () => parts(m.root, 'menubar', 'item')
      const barItem = (text: string) => barItems().find((el) => el.textContent === text)!
      const openMenus = () => parts(m.root, 'menu', 'content').filter((el) => !el.hasAttribute('data-level') && shownInTopLayer(el))
      const row = (label: string) =>
        parts(m.root, 'menu', 'item').find((el) => part(el, 'menu', 'item-text')!.textContent === label)!
      return {
        m,
        bar,
        barItems,
        barItem,
        openMenus,
        row,
        /** The text of what holds focus: a bar item, or a menu row's label. */
        focused: () => {
          const active = document.activeElement as HTMLElement | null
          if (!active || active === document.body) return undefined
          return part(active, 'menu', 'item-text')?.textContent ?? active.textContent
        },
        key: (k: string, target: Element = document.activeElement ?? document.body) => adapter.act(() => keydown(target, k)),
        press: (target: Element) =>
          adapter.act(() => {
            target.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
          }),
      }
    }

    describe('the bar', () => {
      it('is a named menubar of menu items, each saying it opens a menu, with its access key marker gone', async () => {
        const { m, bar, barItems } = await setup()
        expect(bar().getAttribute('role')).toBe('menubar')
        expect(bar().getAttribute('aria-label')).toBe('Application')
        expect(barItems().map((el) => el.textContent)).toEqual(['File', 'Edit', 'Tools', 'Help'])
        for (const item of barItems()) {
          expect(item.getAttribute('role')).toBe('menuitem')
          expect(item.getAttribute('aria-haspopup')).toBe('menu')
          expect(item.getAttribute('aria-expanded')).toBe('false')
        }
        expect(part(barItems()[0], 'menubar', 'mnemonic')!.textContent).toBe('F')
        expect(barItems()[2].getAttribute('aria-disabled')).toBe('true')
        expect(m.root.querySelector('[class]')).toBeNull()
        // No menu is rendered until one opens.
        expect(parts(m.root, 'menu', 'content')).toHaveLength(0)
      })

      it('has one tab stop; arrows move focus along it, disabled items included, and wrap', async () => {
        const { barItems, focused, key } = await setup()
        expect(barItems().map((el) => el.tabIndex)).toEqual([0, -1, -1, -1])
        await adapter.act(() => barItems()[0].focus())
        await key('ArrowRight')
        expect(focused()).toBe('Edit')
        await key('ArrowRight')
        expect(focused()).toBe('Tools')
        expect(barItems().map((el) => el.tabIndex)).toEqual([-1, -1, 0, -1])
        await key('End')
        expect(focused()).toBe('Help')
        await key('ArrowRight')
        expect(focused()).toBe('File')
        await key('ArrowLeft')
        expect(focused()).toBe('Help')
      })

      it('ArrowDown or Enter opens the menu on its first row, ArrowUp on its last; a disabled one never opens', async () => {
        const { barItem, openMenus, focused, key } = await setup()
        await adapter.act(() => barItem('Edit').focus())
        await key('ArrowDown')
        expect(focused()).toBe('Undo')
        expect(barItem('Edit').getAttribute('aria-expanded')).toBe('true')
        const menu = openMenus()[0]
        expect(menu.getAttribute('aria-labelledby')).toBe(barItem('Edit').id)
        expect(barItem('Edit').getAttribute('aria-controls')).toBe(menu.id)
        await key('Escape')
        expect(focused()).toBe('Edit')
        await key('ArrowUp')
        expect(focused()).toBe('Redo')
        await key('Escape')
        await key('ArrowRight')
        await key('Enter')
        expect(openMenus()).toHaveLength(0)
        expect(focused()).toBe('Tools')
      })
    })

    describe('between menus', () => {
      it('ArrowRight on a row with no submenu opens the next menu; disabled menus are skipped; ArrowLeft goes back', async () => {
        const { barItem, openMenus, focused, key } = await setup()
        await adapter.act(() => barItem('File').focus())
        await key('Enter')
        await key('ArrowRight')
        expect(focused()).toBe('Undo')
        expect(barItem('File').getAttribute('aria-expanded')).toBe('false')
        expect(openMenus()).toHaveLength(1)
        await key('ArrowRight')
        expect(focused()).toBe('About')
        await key('ArrowLeft')
        expect(focused()).toBe('Undo')
      })

      it('ArrowRight on a submenu row opens the submenu; inside it ArrowRight moves on, ArrowLeft comes back first', async () => {
        const { barItem, focused, key } = await setup()
        await adapter.act(() => barItem('File').focus())
        await key('Enter')
        await key('ArrowDown')
        await key('ArrowRight')
        expect(focused()).toBe('a.txt')
        await key('ArrowLeft')
        expect(focused()).toBe('Open Recent')
        await key('ArrowRight')
        await key('ArrowRight')
        expect(focused()).toBe('Undo')
      })

      it('a press opens a menu and a second press closes it; hovering another item while open switches', async () => {
        const onOpenChange = vi.fn()
        const { barItem, openMenus, focused } = await setup({ onOpenChange })
        await adapter.act(() => click(barItem('File')))
        expect(openMenus()).toHaveLength(1)
        // Opened by a pointer: focus on the menu, no row highlighted.
        expect(document.activeElement).toBe(openMenus()[0])
        const hover = (el: Element) =>
          adapter.act(() => {
            el.dispatchEvent(new MouseEvent('pointerover', { bubbles: true, relatedTarget: document.body }))
            el.dispatchEvent(new MouseEvent('pointerenter', { bubbles: false, relatedTarget: document.body }))
          })
        await hover(barItem('Help'))
        expect(barItem('Help').getAttribute('aria-expanded')).toBe('true')
        expect(barItem('File').getAttribute('aria-expanded')).toBe('false')
        expect(openMenus()).toHaveLength(1)
        await adapter.act(() => click(barItem('Help')))
        expect(openMenus()).toHaveLength(0)
        expect(onOpenChange.mock.calls).toEqual([['file'], ['help'], [null]])
        // Nothing open: hovering opens nothing.
        await hover(barItem('Edit'))
        expect(openMenus()).toHaveLength(0)
      })
    })

    describe('choosing and closing', () => {
      it('choosing a row reports it with its menu, closes, and returns focus to the bar item', async () => {
        const onSelect = vi.fn()
        const { barItem, openMenus, focused, key } = await setup({ onSelect })
        await adapter.act(() => barItem('File').focus())
        await key('Enter')
        await key('ArrowDown')
        await key('ArrowRight')
        await key('ArrowDown')
        await key('Enter')
        expect(onSelect).toHaveBeenCalledWith('b', { item: { value: 'b', label: 'b.txt' }, menu: 'file' })
        expect(openMenus()).toHaveLength(0)
        expect(focused()).toBe('File')
        expect(openLayerCount()).toBe(0)
      })

      it('a press inside a menu keeps it; a press outside closes it', async () => {
        const { barItem, openMenus, row, press } = await setup()
        await adapter.act(() => click(barItem('Edit')))
        await press(row('Undo'))
        expect(openMenus()).toHaveLength(1)
        await press(document.body)
        expect(openMenus()).toHaveLength(0)
      })

      it('unmounted while a menu is open, it leaves nothing listening', async () => {
        const { m, barItem } = await setup()
        await adapter.act(() => click(barItem('File')))
        expect(openLayerCount()).toBe(1)
        await m.unmount()
        expect(openLayerCount()).toBe(0)
      })
    })

    describe('access keys', () => {
      const alt = (key: string, code: string) =>
        document.body.dispatchEvent(new KeyboardEvent('keydown', { key, code, altKey: true, bubbles: true, cancelable: true }))

      it('off by default: Alt+F does nothing and no shortcut is announced', async () => {
        const { barItem, openMenus } = await setup()
        expect(barItem('File').hasAttribute('aria-keyshortcuts')).toBe(false)
        await adapter.act(() => alt('f', 'KeyF'))
        expect(openMenus()).toHaveLength(0)
      })

      it('Alt+key opens its menu on the first row, by the typed or the physical key; a held Alt underlines the keys', async () => {
        const { bar, barItem, focused } = await setup({ mnemonics: true })
        expect(barItem('Edit').getAttribute('aria-keyshortcuts')).toBe('Alt+E')
        await adapter.act(() => {
          document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Alt', altKey: true, bubbles: true }))
        })
        expect(bar().hasAttribute('data-mnemonics')).toBe(true)
        await adapter.act(() => {
          document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'Alt', bubbles: true }))
        })
        expect(bar().hasAttribute('data-mnemonics')).toBe(false)

        await adapter.act(() => alt('e', 'KeyE'))
        expect(focused()).toBe('Undo')
        await adapter.act(() => {
          ;(document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
        })
        // A Cyrillic layout types "у" on the E key.
        await adapter.act(() => alt('у', 'KeyE'))
        expect(focused()).toBe('Undo')
      })

      it('F10 moves focus to the first menu of the bar', async () => {
        const { barItem, focused, key } = await setup({ mnemonics: true })
        await adapter.act(() => barItem('Help').focus())
        await key('ArrowDown')
        expect(focused()).toBe('About')
        const outside = document.createElement('button')
        document.body.append(outside)
        outside.focus()
        await adapter.act(() => {
          outside.dispatchEvent(new KeyboardEvent('keydown', { key: 'F10', bubbles: true, cancelable: true }))
        })
        expect(focused()).toBe('File')
        expect(document.activeElement).toBe(barItem('File'))
      })

      it('F10 from inside an open menu closes it and lands on the first menu, not the one that closed', async () => {
        const { barItem, openMenus, key } = await setup({ mnemonics: true })
        await adapter.act(() => barItem('Help').focus())
        await key('ArrowDown')
        await adapter.act(() => {
          ;(document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'F10', bubbles: true, cancelable: true }))
        })
        await new Promise((resolve) => setTimeout(resolve, 0))
        await adapter.act(() => {})
        expect(openMenus()).toHaveLength(0)
        expect(document.activeElement).toBe(barItem('File'))
      })
    })
  })
}
