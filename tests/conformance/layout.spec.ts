import { describe, expect, it } from 'vitest'
import { type Adapter, click, freshTarget, part, parts } from './harness'

const key = (target: Element, name: string, init: KeyboardEventInit = {}) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...init }))

const links = [
  { label: 'Leads', href: '#leads' },
  { label: 'Reports', href: '#reports' },
]

/**
 * The frame of an application in each framework: the shell and its drawer,
 * the split and its separator, the rail, the status strip. Layout itself —
 * the breakpoint, the drawer sliding, a real drag — is the browser run's.
 */
export function layoutConformance(adapter: Adapter) {
  describe('shell', () => {
    const setup = async (props: Partial<Parameters<Adapter['shell']>[0]> = {}) => {
      const changes: [boolean, string][] = []
      const m = await adapter.shell(
        { brand: 'Leads app', links, header: 'Header', footer: 'Footer', body: 'Work', onOpenChange: (open, { reason }) => changes.push([open, reason]), ...props },
        freshTarget()
      )
      const root = () => part(m.root, 'shell', 'root')!
      const toggle = () => part(m.root, 'shell', 'toggle') as HTMLButtonElement | null
      const aside = () => part(m.root, 'shell', 'aside')
      return { m, root, toggle, aside, changes }
    }

    it('is a frame of landmarks: a header, the main work area and a footer, with a skip link to the work', async () => {
      const { m, root } = await setup()
      const header = part(m.root, 'shell', 'header')!
      const main = part(m.root, 'shell', 'main')!
      const footer = part(m.root, 'shell', 'footer')!
      expect(header.tagName).toBe('HEADER')
      expect(main.tagName).toBe('MAIN')
      expect(footer.tagName).toBe('FOOTER')
      expect(main.textContent).toBe('Work')
      expect(header.textContent).toContain('Header')
      expect(part(m.root, 'shell', 'brand')!.textContent).toBe('Leads app')
      expect(part(m.root, 'shell', 'aside')!.querySelector('[data-scope="nav"]')).toBeTruthy()

      const skip = part(m.root, 'shell', 'skip-link') as HTMLAnchorElement
      expect(skip.getAttribute('href')).toBe(`#${main.id}`)
      expect(skip.textContent).toBe('Skip to content')
      // The first thing a keyboard meets.
      expect(root().firstElementChild).toBe(skip)
      await adapter.act(() => click(skip))
      expect(document.activeElement).toBe(main)
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('the drawer opens from its toggle, takes the focus, and Escape gives it back', async () => {
      const { root, toggle, aside, changes } = await setup()
      expect(toggle()!.getAttribute('aria-expanded')).toBe('false')
      expect(toggle()!.getAttribute('aria-controls')).toBe(aside()!.id)
      expect(toggle()!.getAttribute('aria-label')).toBe('Navigation')
      expect(root().dataset.collapse).toBe('drawer')

      await adapter.act(() => click(toggle()!))
      await adapter.wait(0)
      expect(toggle()!.getAttribute('aria-expanded')).toBe('true')
      expect(root().dataset.state).toBe('open')
      expect(aside()!.contains(document.activeElement)).toBe(true)

      await adapter.act(() => void key(document.activeElement!, 'Escape'))
      await adapter.wait(0)
      expect(toggle()!.getAttribute('aria-expanded')).toBe('false')
      expect(document.activeElement).toBe(toggle())
      expect(changes).toEqual([
        [true, 'toggle'],
        [false, 'escape'],
      ])
    })

    it('a link followed from the drawer closes it', async () => {
      const { aside, toggle, changes } = await setup()
      await adapter.act(() => click(toggle()!))
      await adapter.wait(0)
      await adapter.act(() => click(aside()!.querySelector('a[href="#reports"]')!))
      await adapter.wait(0)
      expect(toggle()!.getAttribute('aria-expanded')).toBe('false')
      expect(changes.at(-1)).toEqual([false, 'navigate'])
    })

    it('a bar has no toggle to show; a shell with no column has neither column nor toggle', async () => {
      const bar = await setup({ collapse: 'bar' })
      expect(bar.root().dataset.collapse).toBe('bar')
      expect(bar.toggle()!.hidden).toBe(true)
      const bare = await setup({ links: [] })
      expect(bare.aside()).toBeNull()
      expect(bare.toggle()).toBeNull()
    })
  })

  describe('split', () => {
    const setup = async (props: Partial<Parameters<Adapter['split']>[0]> = {}) => {
      const sizes: [number, boolean][] = []
      // Room for the largest size and the other pane's minimum, both ways: in a
      // browser the frame's own size is a bound too.
      const target = freshTarget()
      target.style.cssText = 'display: grid; inline-size: 1000px; block-size: 1000px'
      const m = await adapter.split(
        { label: 'Resize the list', first: 'List', second: 'Detail', min: 200, max: 500, defaultSize: 300, step: 10, onSizeChange: (size, { collapsed }) => sizes.push([size, collapsed]), ...props },
        target
      )
      const root = () => part(m.root, 'split', 'root')!
      const separator = () => part(m.root, 'split', 'separator')!
      const panes = () => parts(m.root, 'split', 'pane')
      const press = (name: string, init: KeyboardEventInit = {}) => adapter.act(() => void key(separator(), name, init))
      return { m, root, separator, panes, press, sizes }
    }

    it('is two panes and a focusable separator whose value is the first pane’s size', async () => {
      const { m, root, separator, panes } = await setup()
      expect(panes().map((pane) => pane.textContent)).toEqual(['List', 'Detail'])
      expect([...root().children].map((child) => (child as HTMLElement).dataset.part)).toEqual(['pane', 'separator', 'pane'])
      const line = separator()
      expect(line.getAttribute('role')).toBe('separator')
      expect(line.tabIndex).toBe(0)
      expect(line.getAttribute('aria-label')).toBe('Resize the list')
      expect(line.getAttribute('aria-orientation')).toBe('vertical')
      expect(line.getAttribute('aria-controls')).toBe(panes()[0].id)
      expect(line.getAttribute('aria-valuenow')).toBe('300')
      expect(line.getAttribute('aria-valuemin')).toBe('200')
      expect(line.getAttribute('aria-valuemax')).toBe('500')
      expect(root().style.getPropertyValue('--gg-split-size')).toBe('300px')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('arrow keys move it by a step, Shift by four, Home and End to the bounds, a double click back', async () => {
      const { separator, press, sizes } = await setup()
      await press('ArrowRight')
      expect(separator().getAttribute('aria-valuenow')).toBe('310')
      await press('ArrowLeft', { shiftKey: true })
      expect(separator().getAttribute('aria-valuenow')).toBe('270')
      await press('End')
      expect(separator().getAttribute('aria-valuenow')).toBe('500')
      await press('Home')
      expect(separator().getAttribute('aria-valuenow')).toBe('200')
      await adapter.act(() => void separator().dispatchEvent(new MouseEvent('dblclick', { bubbles: true })))
      expect(separator().getAttribute('aria-valuenow')).toBe('300')
      expect(sizes.map(([size]) => size)).toEqual([310, 270, 500, 200, 300])
    })

    it('Enter folds a collapsible pane away and back', async () => {
      const { separator, panes, press, sizes } = await setup({ collapsible: true })
      expect(separator().getAttribute('aria-valuemin')).toBe('0')
      await press('Enter')
      expect(panes()[0].hidden).toBe(true)
      expect(separator().getAttribute('aria-valuenow')).toBe('0')
      await press('Enter')
      expect(panes()[0].hidden).toBe(false)
      expect(sizes).toEqual([
        [300, true],
        [300, false],
      ])
    })

    it('one pane over the other moves with Up and Down; the end pane can be the sized one', async () => {
      const vertical = await setup({ orientation: 'vertical' })
      expect(vertical.separator().getAttribute('aria-orientation')).toBe('horizontal')
      await vertical.press('ArrowDown')
      expect(vertical.separator().getAttribute('aria-valuenow')).toBe('310')
      const end = await setup({ primary: 'end' })
      expect(end.separator().getAttribute('aria-controls')).toBe(end.panes()[1].id)
      // Towards the start grows the end pane.
      await end.press('ArrowLeft')
      expect(end.separator().getAttribute('aria-valuenow')).toBe('310')
    })
  })

  describe('rail', () => {
    it('is a named navigation of glyphs with their names, the current one marked, the end ones last', async () => {
      const m = await adapter.rail(
        {
          label: 'Sections',
          items: [
            { label: 'Settings', href: '#settings', icon: 'settings', end: true },
            { label: 'Leads', href: '#leads', icon: 'list', current: true, count: 3 },
            { label: 'Reports', href: '#reports', icon: 'chart' },
          ],
        },
        freshTarget()
      )
      const root = part(m.root, 'rail', 'root')!
      expect(root.getAttribute('aria-label')).toBe('Sections')
      expect(root.tagName === 'NAV' || root.getAttribute('role') === 'navigation').toBe(true)
      const items = parts(m.root, 'rail', 'item')
      expect(items.map((item) => part(item, 'rail', 'label')!.textContent)).toEqual(['Leads', 'Reports', 'Settings'])
      expect(items[0].getAttribute('aria-current')).toBe('page')
      expect(items[1].hasAttribute('aria-current')).toBe(false)
      expect(part(items[0], 'rail', 'icon')!.dataset.icon).toBe('list')
      expect(part(items[0], 'rail', 'icon')!.getAttribute('aria-hidden')).toBe('true')
      expect(part(items[0], 'rail', 'count')!.textContent).toBe('3')
      // The spacer stands before the ones at the bottom.
      expect(part(m.root, 'rail', 'spacer')!.nextElementSibling).toBe(items[2])
      expect(m.root.querySelector('[class]')).toBeNull()
    })
  })

  describe('status bar', () => {
    it('is one strip of readings, named as a group, with news in its tone and a spacer to the end', async () => {
      const m = await adapter.statusBar(
        { label: 'Editor status', items: [{ text: 'main' }, { text: '2 errors', tone: 'error' }], end: [{ text: 'UTF-8' }] },
        freshTarget()
      )
      const root = part(m.root, 'status-bar', 'root')!
      expect(root.getAttribute('role')).toBe('group')
      expect(root.getAttribute('aria-label')).toBe('Editor status')
      const items = parts(m.root, 'status-bar', 'item')
      expect(items.map((item) => item.textContent)).toEqual(['main', '2 errors', 'UTF-8'])
      expect(items[1].dataset.tone).toBe('error')
      expect(part(m.root, 'status-bar', 'spacer')!.nextElementSibling).toBe(items[2])
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('without a name it is plain readings, not a group', async () => {
      const m = await adapter.statusBar({ items: [{ text: 'Ready' }] }, freshTarget())
      expect(part(m.root, 'status-bar', 'root')!.hasAttribute('role')).toBe(false)
    })
  })
}
