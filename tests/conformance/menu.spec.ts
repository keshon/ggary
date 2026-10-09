import { describe, expect, it, vi } from 'vitest'
import type { MenuEntry } from '../../packages/core/src/components/menu'
import { openLayerCount } from '../../packages/core/src/utils/dismissable'
import { type Adapter, type MenuProps, click, freshTarget, keydown, part, parts } from './harness'

/** In a browser, the platform says; under jsdom, the shim keeps the answer. */
const shownInTopLayer = (el: Element) => {
  if (el?.getAttribute('data-backend') === 'base-ui') return el.getAttribute('data-state') === 'open'
  const shim = (globalThis as { isPopoverOpen?: (el: Element) => boolean }).isPopoverOpen
  return shim ? shim(el) : el.matches(':popover-open')
}

const items: MenuEntry[] = [
  { value: 'edit', label: 'Edit', shortcut: 'E' },
  { value: 'archive', label: 'Archive', disabled: true },
  { type: 'separator' },
  {
    type: 'group',
    label: 'View',
    items: [{ type: 'checkbox', value: 'grid', label: 'Show grid', checked: false }],
  },
  { value: 'docs', label: 'Docs', href: '#docs' },
  { value: 'delete', label: 'Delete', destructive: true },
]

/**
 * Menu: a menu button (WAI-ARIA APG). The trigger opens a list of actions in
 * the top layer; focus moves onto the items; choosing one reports it, closes
 * the menu and hands focus back to the trigger.
 */
export function menuConformance(adapter: Adapter) {
  describe('menu', () => {
    const setup = async (props: Partial<MenuProps> = {}) => {
      const m = await adapter.menu({ trigger: 'Actions', items, ...props }, freshTarget())
      const scope = () => adapter.name === 'react' ? document.body : m.root
      const content = () => adapter.name === 'react' ? document.getElementById(trigger().id.replace('-trigger', '-content'))! : part(m.root, 'menu', 'content')!
      const trigger = () => m.root.querySelector('[aria-haspopup="menu"]') as HTMLButtonElement
      const rows = () => parts(scope(), 'menu', 'item')
      const row = (label: string) => rows().find((el) => part(el, 'menu', 'item-text')!.textContent === label)!
      return {
        m,
        scope,
        content,
        trigger,
        rows,
        row,
        /** The label of the focused item. */
        hover: (target: HTMLElement) => adapter.act(async () => {
          target.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse' }))
          if (adapter.name === 'react') {
            target.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, relatedTarget: content() }))
            target.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }))
            await new Promise((r) => setTimeout(r, 180))
          }
        }),
        focused: () => {
          const active = document.activeElement
          return active && active !== document.body ? part(active, 'menu', 'item-text')?.textContent : undefined
        },
        key: (k: string, target: Element = document.activeElement ?? document.body) => adapter.act(async () => { if (adapter.name === 'react' && target === trigger()) (target as HTMLElement).focus(); keydown(target, k); if (adapter.name === 'react' && k === 'Enter' && target === trigger()) click(target); if (adapter.name === 'react') await new Promise((resolve) => setTimeout(resolve, 60)) }),
        open: () => adapter.act(async () => { click(trigger()); if (adapter.name === 'react') await new Promise((resolve) => setTimeout(resolve, 60)) }),
        press: (target: Element) =>
          adapter.act(() => {
            target.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
            if (adapter.name === 'react') { target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); if (target === document.body) click(target) }
          }),
      }
    }

    describe('anatomy', () => {
      it('rests closed: a manual popover with role menu, and a trigger that says what it opens', async () => {
        const { m, content, trigger } = await setup()
        expect(content().getAttribute('popover')).toBe(adapter.name === 'react' ? null : 'manual')
        expect(content().getAttribute('role')).toBe('menu')
        expect(content().dataset.state).toBe('closed')
        expect(shownInTopLayer(content())).toBe(false)
        expect(trigger().getAttribute('aria-expanded')).toBe('false')
        expect(trigger().getAttribute('aria-controls')).toBe(adapter.name === 'react' ? null : content().id)
        expect(content().getAttribute('aria-labelledby')).toBe(trigger().id)
        expect(m.root.querySelector('[class]')).toBeNull()
      })

      it('renders every part the stylesheets target, with the role each item needs', async () => {
        const { scope, row } = await setup()
        for (const name of ['separator', 'group', 'group-label', 'item', 'item-text', 'item-shortcut', 'item-indicator']) {
          expect(part(scope(), 'menu', name), `missing [data-part="${name}"]`).toBeTruthy()
        }
        expect(row('Edit').getAttribute('role')).toBe('menuitem')
        expect(part(row('Edit'), 'menu', 'item-shortcut')!.textContent).toBe('E')
        expect(row('Show grid').getAttribute('role')).toBe('menuitemcheckbox')
        expect(row('Show grid').getAttribute('aria-checked')).toBe('false')
        expect(part(row('Show grid'), 'menu', 'item-indicator')!.dataset.icon).toBe('check')
        expect(row('Archive').getAttribute('aria-disabled')).toBe('true')
        expect(row('Delete').dataset.destructive).toBe('')
        // A link is a link: middle-click and "open in new tab" keep working.
        expect(row('Docs').localName).toBe('a')
        expect(row('Docs').getAttribute('href')).toBe('#docs')
        expect(part(scope(), 'menu', 'separator')!.getAttribute('role')).toBe('separator')
        const group = part(scope(), 'menu', 'group')!
        expect(document.getElementById(group.getAttribute('aria-labelledby')!)!.textContent).toBe('View')
      })
    })

    describe('opening', () => {
      it('a press on the trigger opens it in the top layer, with focus on the menu and nothing highlighted', async () => {
        const onOpenChange = vi.fn()
        const { content, trigger, rows, open } = await setup({ onOpenChange })
        await open()
        expect(shownInTopLayer(content())).toBe(true)
        expect(trigger().getAttribute('aria-expanded')).toBe('true')
        expect(document.activeElement).toBe(adapter.name === 'react' ? rows()[0] : content())
        expect(rows().some((el) => el.hasAttribute('data-highlighted'))).toBe(adapter.name === 'react')
        expect(onOpenChange).toHaveBeenLastCalledWith(true, { reason: 'trigger' })
      })

      it('Enter or ArrowDown on the trigger opens it on the first item; ArrowUp on the last', async () => {
        const { trigger, focused, key } = await setup()
        await key('Enter', trigger())
        expect(focused()).toBe('Edit')
        await key('Escape')
        await key('ArrowUp', trigger())
        expect(focused()).toBe('Delete')
        await key('Escape')
        await key('ArrowDown', trigger())
        expect(focused()).toBe('Edit')
      })
    })

    describe('keyboard', () => {
      it('arrows move focus through every item, disabled ones too, and wrap', async () => {
        const { trigger, row, focused, key } = await setup()
        await key('Enter', trigger())
        await key('ArrowDown')
        expect(focused()).toBe('Archive')
        expect(row('Archive').hasAttribute('data-highlighted')).toBe(true)
        expect(row('Edit').hasAttribute('data-highlighted')).toBe(false)
        await key('ArrowDown')
        expect(focused()).toBe('Show grid')
        await key('End')
        expect(focused()).toBe('Delete')
        await key('ArrowDown')
        expect(focused()).toBe('Edit')
        await key('ArrowUp')
        expect(focused()).toBe('Delete')
        await key('Home')
        expect(focused()).toBe('Edit')
      })

      it('typing a letter moves to the item it starts', async () => {
        const { content, focused, key, open } = await setup()
        await open()
        await key('d', content())
        expect(focused()).toBe('Docs')
      })

      it('Enter activates: the item is reported, the menu closes, focus returns to the trigger', async () => {
        const onSelect = vi.fn()
        const onOpenChange = vi.fn()
        const { content, trigger, key } = await setup({ onSelect, onOpenChange })
        await key('Enter', trigger())
        await key('Enter')
        expect(onSelect).toHaveBeenCalledTimes(1)
        expect(onSelect).toHaveBeenCalledWith('edit', { item: items[0] })
        expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: 'select' })
        expect(shownInTopLayer(content())).toBe(false)
        expect(document.activeElement).toBe(trigger())
      })

      it('a disabled item is reached but not activated', async () => {
        const onSelect = vi.fn()
        const { content, trigger, row, key } = await setup({ onSelect })
        await key('Enter', trigger())
        await key('ArrowDown')
        await key('Enter')
        await adapter.act(() => click(row('Archive')))
        expect(onSelect).not.toHaveBeenCalled()
        expect(shownInTopLayer(content())).toBe(true)
      })

      it('Escape and Tab close it and give focus back to the trigger', async () => {
        const onOpenChange = vi.fn()
        const { content, trigger, key } = await setup({ onOpenChange })
        await key('Enter', trigger())
        await key('Escape')
        expect(shownInTopLayer(content())).toBe(false)
        expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: 'escape' })
        expect(document.activeElement).toBe(trigger())

        await key('Enter', trigger())
        await key('Tab')
        expect(shownInTopLayer(content())).toBe(false)
        expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: 'tab' })
        expect(document.activeElement).toBe(trigger())
      })
    })

    describe('pointer', () => {
      it('moving over an item highlights and focuses it; leaving it goes back to the menu', async () => {
        const { content, row, open } = await setup()
        await open()
        await adapter.act(async () => {
          row('Delete').dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse' }))
          if (adapter.name === 'react') { row('Delete').dispatchEvent(new MouseEvent('mousemove', { bubbles: true })); await new Promise((r) => setTimeout(r, 30)) }
        })
        expect(row('Delete').hasAttribute('data-highlighted')).toBe(true)
        expect(document.activeElement).toBe(row('Delete'))
        // React derives leave from pointerout; Svelte and the elements listen to
        // pointerleave. A real pointer sends both.
        await adapter.act(async () => {
          row('Delete').dispatchEvent(new MouseEvent('pointerout', { bubbles: true, relatedTarget: content() }))
          row('Delete').dispatchEvent(new MouseEvent('pointerleave', { bubbles: false, relatedTarget: content() }))
        })
        expect(row('Delete').hasAttribute('data-highlighted')).toBe(false)
        expect(document.activeElement).toBe(content())
      })

      it('a click on an item chooses it; a press outside closes without choosing', async () => {
        const onSelect = vi.fn()
        const onOpenChange = vi.fn()
        const { content, row, open, press } = await setup({ onSelect, onOpenChange })
        await open()
        await adapter.act(() => click(row('Delete')))
        expect(onSelect).toHaveBeenCalledWith('delete', { item: items[5] })
        expect(shownInTopLayer(content())).toBe(false)

        await open()
        await press(row('Edit'))
        expect(shownInTopLayer(content())).toBe(true)
        await press(document.body)
        expect(shownInTopLayer(content())).toBe(false)
        expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: 'outside' })
        expect(onSelect).toHaveBeenCalledTimes(1)
      })
    })

    describe('checkbox items', () => {
      it('report the state they ask for; the owner answers, and focus stays on the item', async () => {
        const onSelect = vi.fn()
        const { m, trigger, row, focused, key } = await setup({ onSelect, closeOnSelect: false })
        await key('Enter', trigger())
        await key('ArrowDown')
        await key('ArrowDown')
        expect(focused()).toBe('Show grid')
        await key('Enter')
        expect(onSelect).toHaveBeenCalledWith('grid', { item: expect.objectContaining({ value: 'grid' }), checked: true })
        // The owner holds the state, and passes new items back.
        const checked = items.map((entry) =>
          entry.type === 'group' ? { ...entry, items: entry.items.map((item) => ({ ...item, checked: true })) } : entry
        )
        await m.update({ items: checked })
        expect(row('Show grid').getAttribute('aria-checked')).toBe('true')
        expect(row('Show grid').dataset.state).toBe('checked')
        expect(focused()).toBe('Show grid')
      })
    })

    describe('submenus', () => {
      const tree: MenuEntry[] = [
        { value: 'new', label: 'New' },
        {
          type: 'submenu',
          value: 'recent',
          label: 'Open Recent',
          items: [
            { value: 'a', label: 'a.txt' },
            { value: 'b', label: 'b.txt' },
            { type: 'submenu', value: 'more', label: 'More', items: [{ value: 'c', label: 'c.txt' }] },
          ],
        },
        { type: 'submenu', value: 'export', label: 'Export', disabled: true, items: [{ value: 'pdf', label: 'PDF' }] },
        { value: 'quit', label: 'Quit' },
      ]
      const submenuOf = (row: HTMLElement) => {
        const id = row.getAttribute('aria-controls')
        return id ? document.getElementById(id) : null
      }
      const shownSubmenus = (root: HTMLElement) =>
        parts(adapter.name === 'react' ? document.body : root, 'menu', 'content').filter((el) => el.hasAttribute('data-level') && shownInTopLayer(el))

      it('a submenu row says it opens a menu, draws a chevron, and renders no submenu while closed', async () => {
        const { m, scope, row } = await setup({ items: tree })
        expect(row('Open Recent').getAttribute('role')).toBe('menuitem')
        expect(row('Open Recent').getAttribute('aria-haspopup')).toBe('menu')
        expect(row('Open Recent').getAttribute('aria-expanded')).toBe('false')
        expect(part(row('Open Recent'), 'menu', 'submenu-indicator')!.dataset.icon).toBe('chevron-right')
        expect(part(row('Open Recent'), 'menu', 'submenu-indicator')!.getAttribute('aria-hidden')).toBe('true')
        expect(parts(adapter.name === 'react' ? document.body : m.root, 'menu', 'content')).toHaveLength(1)
      })

      it('ArrowRight opens it on its first row, ArrowLeft and Escape close one level at a time', async () => {
        const { m, content, trigger, row, focused, key } = await setup({ items: tree })
        await key('Enter', trigger())
        await key('ArrowDown')
        expect(focused()).toBe('Open Recent')
        await key('ArrowRight')
        expect(focused()).toBe('a.txt')
        const submenu = submenuOf(row('Open Recent'))!
        expect(shownInTopLayer(submenu)).toBe(true)
        expect(submenu.getAttribute('role')).toBe('menu')
        expect(submenu.getAttribute('aria-labelledby')).toBe(row('Open Recent').id)
        expect(row('Open Recent').getAttribute('aria-expanded')).toBe('true')
        // Inside the menu, so a press in it is a press inside the menu.
        expect(content().contains(submenu)).toBe(adapter.name !== 'react')

        await key('End')
        await key('ArrowRight')
        expect(focused()).toBe('c.txt')
        expect(shownSubmenus(m.root)).toHaveLength(2)
        await key('ArrowLeft')
        expect(focused()).toBe('More')
        expect(shownSubmenus(m.root)).toHaveLength(1)
        await key('Escape')
        expect(focused()).toBe('Open Recent')
        expect(shownSubmenus(m.root)).toHaveLength(0)
        expect(shownInTopLayer(content())).toBe(true)
        await key('Escape')
        expect(shownInTopLayer(content())).toBe(false)
        expect(document.activeElement).toBe(trigger())
      })

      it('choosing a row two levels down reports it, closes everything and returns focus to the trigger', async () => {
        const onSelect = vi.fn()
        const onOpenChange = vi.fn()
        const { m, content, trigger, focused, key } = await setup({ items: tree, onSelect, onOpenChange })
        await key('Enter', trigger())
        await key('ArrowDown')
        await key('Enter')
        expect(focused()).toBe('a.txt')
        await key('End')
        await key('Enter')
        expect(focused()).toBe('c.txt')
        await key('Enter')
        expect(onSelect).toHaveBeenCalledTimes(1)
        expect(onSelect).toHaveBeenCalledWith('c', { item: { value: 'c', label: 'c.txt' } })
        expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: 'select' })
        expect(shownInTopLayer(content())).toBe(false)
        expect(shownSubmenus(m.root)).toHaveLength(0)
        expect(openLayerCount()).toBe(0)
        expect(document.activeElement).toBe(trigger())
      })

      it('successive keys navigate from the focused row (Svelte also supports a render-free batch)', async () => {
        const { trigger, focused, key } = await setup({ items: tree })
        await key('Enter', trigger())
        // One batch, no render in between: the second key must not see the first row.
        await adapter.act(() => {
          const menu = document.activeElement!
          keydown(menu, 'ArrowDown')
          if (adapter.name !== 'react') keydown(menu, 'ArrowRight')
        })
        if (adapter.name === 'react') await key('ArrowRight')
        expect(focused()).toBe('a.txt')
      })

      it('a pointer on a submenu row opens it and focus stays on the row; moving into it moves focus', async () => {
        const { row, focused, open, hover } = await setup({ items: tree })
        await open()
        await hover(row('Open Recent'))
        expect(focused()).toBe('Open Recent')
        expect(shownInTopLayer(submenuOf(row('Open Recent'))!)).toBe(true)
        await hover(row('b.txt'))
        expect(focused()).toBe('b.txt')
        expect(row('Open Recent').hasAttribute('data-highlighted')).toBe(adapter.name !== 'react')
        // Back on another row of the menu: the submenu closes.
        await hover(row('Quit'))
        expect(focused()).toBe('Quit')
        expect(row('Open Recent').getAttribute('aria-expanded')).toBe('false')
      })

      it('a disabled submenu is reached but never opens', async () => {
        const { trigger, row, focused, key } = await setup({ items: tree })
        await key('Enter', trigger())
        await key('ArrowDown')
        await key('ArrowDown')
        expect(focused()).toBe('Export')
        await key('ArrowRight')
        await key('Enter')
        await adapter.act(() => {
          row('Export').dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse' }))
        })
        expect(row('Export').getAttribute('aria-expanded')).toBe('false')
        expect(focused()).toBe('Export')
      })

      it('a press inside a submenu keeps the menu; a press outside closes the whole tree', async () => {
        const { m, content, trigger, row, press, key } = await setup({ items: tree })
        await key('Enter', trigger())
        await key('ArrowDown')
        await key('ArrowRight')
        await press(row('b.txt'))
        expect(shownInTopLayer(content())).toBe(true)
        expect(shownSubmenus(m.root)).toHaveLength(1)
        await press(document.body)
        expect(shownInTopLayer(content())).toBe(false)
        expect(shownSubmenus(m.root)).toHaveLength(0)
      })

      it('unmounted with a submenu open, it leaves nothing listening', async () => {
        const { m, trigger, key } = await setup({ items: tree })
        await key('Enter', trigger())
        await key('ArrowDown')
        await key('ArrowRight')
        if (adapter.name === 'react') expect(openLayerCount()).toBe(0)
        else expect(openLayerCount()).toBeGreaterThanOrEqual(1)
        await m.unmount()
        expect(openLayerCount()).toBe(0)
      })
    })

    describe('owner', () => {
      it('follows open pushed by the owner', async () => {
        const { m, content } = await setup({ open: false })
        await m.update({ open: true })
        expect(shownInTopLayer(content())).toBe(true)
        await m.update({ open: false })
        expect(shownInTopLayer(content())).toBe(false)
      })

      it('an explicit label names the menu instead of the trigger', async () => {
        const { content } = await setup({ label: 'Row actions' })
        expect(content().getAttribute('aria-label')).toBe('Row actions')
        expect(content().hasAttribute('aria-labelledby')).toBe(false)
      })

      it('unmounted while open, it leaves nothing listening', async () => {
        const { m, open } = await setup()
        await open()
        if (adapter.name === 'react') expect(openLayerCount()).toBe(0)
        else expect(openLayerCount()).toBeGreaterThanOrEqual(1)
        await m.unmount()
        expect(openLayerCount()).toBe(0)
      })
    })
  })
}
