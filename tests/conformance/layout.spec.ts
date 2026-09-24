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

/**
 * The flow primitives, the page header and the section: prop bags, so the
 * question is the same markup and the same names in every framework.
 */
export function flowConformance(adapter: Adapter) {
  describe('flow primitives', () => {
    it('each is one element around what it holds, saying its gap and its option', async () => {
      const cases = [
        { kind: 'stack', gap: 'loose', attr: 'gap', value: 'loose' },
        { kind: 'cluster', justify: 'between', attr: 'justify', value: 'between' },
        { kind: 'grid', columns: 'wide', attr: 'columns', value: 'wide' },
        { kind: 'container', size: 'prose', attr: 'size', value: 'prose' },
      ] as const
      for (const { attr, value, ...props } of cases) {
        const m = await adapter.flow({ items: ['One', 'Two'], ...props }, freshTarget())
        const root = part(m.root, props.kind, 'root')!
        expect(root.getAttribute(`data-${attr}`)).toBe(value)
        expect([...root.children].map((child) => child.textContent)).toEqual(['One', 'Two'])
        expect(m.root.querySelector('[class]')).toBeNull()
      }
    })

    it('the defaults are named, not absent: a theme styles every step', async () => {
      const m = await adapter.flow({ kind: 'stack', items: ['One'] }, freshTarget())
      expect(part(m.root, 'stack', 'root')!.getAttribute('data-gap')).toBe('default')
    })

    it('a cluster’s spacer stands where it was put, hidden from a screen reader', async () => {
      const m = await adapter.flow({ kind: 'cluster', items: ['One', 'Two', 'Three'], spacerAfter: 2 }, freshTarget())
      const spacer = part(m.root, 'cluster', 'spacer')!
      expect(spacer.getAttribute('aria-hidden')).toBe('true')
      expect(spacer.previousElementSibling!.textContent).toBe('Two')
      expect(spacer.nextElementSibling!.textContent).toBe('Three')
    })
  })

  describe('flex', () => {
    it('says its shape as attributes, with the defaults named: a row, the default gap, from the start', async () => {
      const m = await adapter.flex({ items: [{ text: 'One' }, { text: 'Two' }] }, freshTarget())
      const root = part(m.root, 'flex', 'root')!
      expect(root.dataset.direction).toBe('row')
      expect(root.dataset.gap).toBe('default')
      expect(root.dataset.justify).toBe('start')
      expect(root.hasAttribute('data-align')).toBe(false)
      expect(root.hasAttribute('data-wrap')).toBe(false)
      await m.update({ direction: 'column', gap: 'none', align: 'center', justify: 'between', wrap: true })
      expect(root.dataset.direction).toBe('column')
      expect(root.dataset.gap).toBe('none')
      expect(root.dataset.align).toBe('center')
      expect(root.dataset.justify).toBe('between')
      expect(root.hasAttribute('data-wrap')).toBe(true)
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('an item grows by one, by a share it hands the stylesheet, keeps its size, or aligns itself', async () => {
      const m = await adapter.flex(
        { items: [{ text: 'All', grow: true }, { text: 'Two', grow: 2 }, { text: 'Fixed', shrink: false }, { text: 'Low', align: 'end' }] },
        freshTarget()
      )
      const [all, two, fixed, low] = parts(m.root, 'flex-item', 'root')
      expect(all.hasAttribute('data-grow')).toBe(true)
      expect(all.style.getPropertyValue('--gg-flex-grow')).toBe('')
      expect(two.style.getPropertyValue('--gg-flex-grow')).toBe('2')
      expect(fixed.dataset.shrink).toBe('false')
      expect(fixed.hasAttribute('data-grow')).toBe(false)
      expect(low.dataset.align).toBe('end')
    })

    it('Stack and Cluster are its presets: a column, and a row that wraps, centred', async () => {
      const stack = await adapter.flow({ kind: 'stack', items: ['One'] }, freshTarget())
      const column = part(stack.root, 'stack', 'root')!
      expect([column.dataset.direction, column.hasAttribute('data-align')]).toEqual(['column', false])
      const cluster = await adapter.flow({ kind: 'cluster', items: ['One'] }, freshTarget())
      const row = part(cluster.root, 'cluster', 'root')!
      expect([row.dataset.direction, row.dataset.align, row.hasAttribute('data-wrap')]).toEqual(['row', 'center', true])
    })
  })

  describe('columns', () => {
    it('writes each span and start as a custom property, and names the widths it changes at', async () => {
      const m = await adapter.columns(
        {
          columns: [
            { text: 'Main', span: { base: 12, medium: 8 } },
            { text: 'Side', span: { base: 12, medium: 4 } },
            { text: 'Offset', span: 4, start: 5 },
            { text: 'Whole' },
          ],
        },
        freshTarget()
      )
      expect(part(m.root, 'columns', 'root')!.dataset.gap).toBe('default')
      const [main, side, offset, whole] = parts(m.root, 'column', 'root')
      expect(main.style.getPropertyValue('--gg-column-span')).toBe('12')
      expect(main.style.getPropertyValue('--gg-column-span-medium')).toBe('8')
      expect(main.hasAttribute('data-span-medium')).toBe(true)
      expect(main.hasAttribute('data-span-narrow')).toBe(false)
      expect(side.style.getPropertyValue('--gg-column-span-medium')).toBe('4')
      expect(offset.style.getPropertyValue('--gg-column-span')).toBe('4')
      expect(offset.style.getPropertyValue('--gg-column-start')).toBe('5')
      expect(whole.getAttribute('style') ?? '').toBe('')
      expect(main.textContent).toBe('Main')
    })

    it('keeps a span between one and twelve', async () => {
      const m = await adapter.columns({ columns: [{ text: 'Big', span: 20 }, { text: 'None', span: 0 }] }, freshTarget())
      const [big, none] = parts(m.root, 'column', 'root')
      expect(big.style.getPropertyValue('--gg-column-span')).toBe('12')
      expect(none.style.getPropertyValue('--gg-column-span')).toBe('1')
    })
  })

  describe('page header', () => {
    it('is the screen’s one title, described by its line, with context above and actions beside', async () => {
      const m = await adapter.pageHeader(
        { title: 'Leads', description: 'Everyone the sales team is talking to.', context: 'Sales', actions: ['Import', 'New lead'] },
        freshTarget()
      )
      const title = part(m.root, 'page-header', 'title')!
      expect(title.tagName).toBe('H1')
      expect(title.textContent).toBe('Leads')
      const description = part(m.root, 'page-header', 'description')!
      expect(description.textContent).toBe('Everyone the sales team is talking to.')
      expect(title.getAttribute('aria-describedby')).toBe(description.id)
      expect(part(m.root, 'page-header', 'context')!.textContent).toBe('Sales')
      expect([...part(m.root, 'page-header', 'actions')!.querySelectorAll('button')].map((button) => button.textContent)).toEqual(['Import', 'New lead'])
      // Not a banner: the page's banner is the shell's header.
      expect(part(m.root, 'page-header', 'root')!.tagName).not.toBe('HEADER')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('takes another level when it is not the page’s own, and draws nothing it was not given', async () => {
      const m = await adapter.pageHeader({ title: 'Lead 4127', headingLevel: 2 }, freshTarget())
      expect(part(m.root, 'page-header', 'title')!.tagName).toBe('H2')
      expect(part(m.root, 'page-header', 'title')!.hasAttribute('aria-describedby')).toBe(false)
      const shown = (name: string) => {
        const element = part(m.root, 'page-header', name)
        return Boolean(element && !element.hidden)
      }
      expect(shown('description')).toBe(false)
      expect(shown('actions')).toBe(false)
      expect(shown('context')).toBe(false)
    })
  })

  describe('section', () => {
    it('is a heading over its body, with its actions and its line', async () => {
      const m = await adapter.section({ title: 'Notifications', description: 'Where we reach you.', actions: ['Reset'], body: 'Email and push.', rank: 'support' }, freshTarget())
      const root = part(m.root, 'section', 'root')!
      const title = part(m.root, 'section', 'title')!
      expect(title.tagName).toBe('H2')
      expect(title.textContent).toBe('Notifications')
      expect(part(m.root, 'section', 'description')!.textContent).toBe('Where we reach you.')
      expect(part(m.root, 'section', 'actions')!.textContent).toBe('Reset')
      expect(part(m.root, 'section', 'body')!.textContent).toBe('Email and push.')
      expect(root.dataset.rank).toBe('support')
      // Not a landmark unless asked: a screen of ten sections is not ten regions.
      expect(root.hasAttribute('role')).toBe(false)
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('as a region it is named by its heading and described by its line', async () => {
      const m = await adapter.section({ title: 'Danger zone', description: 'Cannot be undone.', region: true, headingLevel: 3, body: 'Delete' }, freshTarget())
      const root = part(m.root, 'section', 'root')!
      const title = part(m.root, 'section', 'title')!
      expect(title.tagName).toBe('H3')
      expect(root.getAttribute('role')).toBe('region')
      expect(root.getAttribute('aria-labelledby')).toBe(title.id)
      expect(root.getAttribute('aria-describedby')).toBe(part(m.root, 'section', 'description')!.id)
    })
  })
}
