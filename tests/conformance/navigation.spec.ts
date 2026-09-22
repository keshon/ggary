import { describe, expect, it, vi } from 'vitest'
import {
  type Adapter,
  type BreadcrumbsProps,
  type NavProps,
  type PaginationProps,
  type StepsProps,
  type ToolbarProps,
  click,
  freshTarget,
  part,
} from './harness'

const path = [
  { label: 'Projects', href: '/projects' },
  { label: 'worldgen', href: '/projects/worldgen' },
  { label: 'Run #4127' },
]

const sections: NavProps['groups'] = [
  {
    label: 'Work',
    items: [
      { label: 'Runs', href: '/runs', icon: 'grid', count: 7, current: true },
      { label: 'Queue', href: '/queue', icon: 'list' },
    ],
  },
  { items: [{ label: 'Settings', href: '/settings', icon: 'settings' }] },
]

/** Hash addresses: a real path would send jsdom off to navigate. */
const pages: PaginationProps['items'] = [
  { label: 'Back', href: '#p7', page: 7 },
  { label: '1', href: '#p1', page: 1 },
  { label: '…', gap: true },
  { label: '8', href: '#p8', page: 8, current: true },
  { label: '9', href: '#p9', page: 9 },
  { label: 'Forward', page: 9, disabled: true },
]

const stages: StepsProps['items'] = [
  { name: 'Source', state: 'done' },
  { name: 'Check', state: 'current' },
  { name: 'Launch', state: 'todo', note: 'waiting' },
]

export function breadcrumbsConformance(adapter: Adapter) {
  describe('breadcrumbs', () => {
    const setup = async (props: Partial<BreadcrumbsProps> = {}) => {
      const m = await adapter.breadcrumbs({ items: path, ...props }, freshTarget())
      const root = () => part(m.root, 'breadcrumbs', 'root')!
      const items = () => [...m.root.querySelectorAll('[data-scope="breadcrumbs"][data-part="item"]')] as HTMLElement[]
      return { m, root, items }
    }

    it('is a named landmark around an ordered list', async () => {
      const { m, root, items } = await setup()
      // The host cannot be a <nav> in every adapter, so the role is what is checked.
      expect(root().getAttribute('role') ?? root().tagName.toLowerCase()).toMatch(/navigation|nav/)
      expect(root().getAttribute('aria-label')).toBe('Breadcrumbs')
      expect(part(m.root, 'breadcrumbs', 'list')!.tagName).toBe('OL')
      expect(items()).toHaveLength(3)
      expect(items().map((item) => item.textContent?.trim())).toEqual(['Projects', 'worldgen', 'Run #4127'])
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('the last crumb is the page: text with aria-current, never a link', async () => {
      const { m, items } = await setup()
      const links = [...m.root.querySelectorAll('[data-scope="breadcrumbs"][data-part="link"]')] as HTMLAnchorElement[]
      expect(links.map((link) => link.getAttribute('href'))).toEqual(['/projects', '/projects/worldgen'])
      const current = part(m.root, 'breadcrumbs', 'current')!
      expect(current.tagName).not.toBe('A')
      expect(current.getAttribute('aria-current')).toBe('page')
      expect(items()[2].dataset.current).toBe('')
    })

    it('takes a name for the landmark, because a screen has several', async () => {
      const { m, root } = await setup({ label: 'Where you are' })
      expect(root().getAttribute('aria-label')).toBe('Where you are')
      await m.update({ label: 'Path' })
      expect(root().getAttribute('aria-label')).toBe('Path')
    })
  })
}

export function navConformance(adapter: Adapter) {
  describe('nav', () => {
    const setup = async (props: Partial<NavProps> = {}) => {
      const m = await adapter.nav({ label: 'Sections', groups: sections, ...props }, freshTarget())
      const root = () => part(m.root, 'nav', 'root')!
      const items = () => [...m.root.querySelectorAll('[data-scope="nav"][data-part="item"]')] as HTMLAnchorElement[]
      const groups = () => [...m.root.querySelectorAll('[data-scope="nav"][data-part="group"]')] as HTMLElement[]
      return { m, root, items, groups }
    }

    it('is a named landmark of real links', async () => {
      const { m, root, items } = await setup()
      expect(root().getAttribute('role') ?? root().tagName.toLowerCase()).toMatch(/navigation|nav/)
      expect(root().getAttribute('aria-label')).toBe('Sections')
      expect(items().map((item) => item.tagName)).toEqual(['A', 'A', 'A'])
      // An address, not a button: the middle click and "open in a new tab" depend on it.
      expect(items().map((item) => item.getAttribute('href'))).toEqual(['/runs', '/queue', '/settings'])
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('names a group that has a name, and leaves an unnamed one a plain container', async () => {
      const { m, groups } = await setup()
      const labels = [...m.root.querySelectorAll('[data-scope="nav"][data-part="group-label"]')] as HTMLElement[]
      expect(labels.map((label) => label.textContent)).toEqual(['Work'])
      expect(groups()[0].getAttribute('role')).toBe('group')
      expect(groups()[0].getAttribute('aria-labelledby')).toBe(labels[0].id)
      expect(groups()[1].hasAttribute('role')).toBe(false)
    })

    it('marks the current item in the markup, with an icon and a count beside it', async () => {
      const { m, items } = await setup()
      expect(items()[0].getAttribute('aria-current')).toBe('page')
      expect(items()[0].dataset.current).toBe('')
      expect(items()[1].hasAttribute('aria-current')).toBe(false)
      const icon = part(items()[0], 'nav', 'icon')!
      expect(icon.dataset.icon).toBe('grid')
      expect(icon.getAttribute('aria-hidden')).toBe('true')
      expect(part(items()[0], 'nav', 'count')!.textContent).toBe('7')
      expect(part(items()[1], 'nav', 'count')).toBeNull()
    })

    const nested: NavProps['groups'] = [
      {
        label: 'Actions',
        items: [
          { label: 'Button', href: '#button', items: [{ label: 'Emphasis', href: '#button-emphasis' }, { label: 'Sizes', href: '#button-sizes', current: true }] },
          { label: 'Select', href: '#select', items: [{ label: 'Uncontrolled', href: '#select-a' }, { label: 'Controlled', href: '#select-b' }] },
          { label: 'Chip', href: '#chip' },
        ],
      },
    ]

    it('an item with sections stands beside a button that opens them; they are open while the reading is inside it', async () => {
      const { m } = await setup({ groups: nested })
      const branches = [...m.root.querySelectorAll<HTMLElement>('[data-scope="nav"][data-part="branch"]')]
      expect(branches).toHaveLength(2)
      const [button, select] = branches.map((branch) => ({
        link: part(branch, 'nav', 'item') as HTMLAnchorElement,
        toggle: part(branch, 'nav', 'toggle') as HTMLButtonElement,
        sections: part(branch, 'nav', 'subitems')!,
      }))
      // The item holding the current section is marked as such; only the section is current.
      expect(button.link.hasAttribute('data-current-branch')).toBe(true)
      expect(button.link.hasAttribute('aria-current')).toBe(false)
      expect(part(button.sections, 'nav', 'item')!.nextElementSibling!.getAttribute('aria-current')).toBe('page')
      expect([button.toggle.tagName, button.toggle.type, button.toggle.getAttribute('aria-expanded')]).toEqual(['BUTTON', 'button', 'true'])
      expect(button.toggle.getAttribute('aria-controls')).toBe(button.sections.id)
      expect(button.toggle.getAttribute('aria-label')).toBe('Button, sections')
      expect(button.sections.getAttribute('role')).toBe('group')
      expect(button.sections.getAttribute('aria-labelledby')).toBe(button.link.id)
      expect(button.sections.hidden).toBe(false)
      expect([...button.sections.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual(['#button-emphasis', '#button-sizes'])
      // Not being read: closed.
      expect(select.toggle.getAttribute('aria-expanded')).toBe('false')
      expect(select.sections.hidden).toBe(true)
      // An item without sections is a plain link, not a branch.
      expect(m.root.querySelector('a[href="#chip"]')!.parentElement!.dataset.part).toBe('group')
    })

    it('the button opens and closes the sections; the owner hears it, and a controlled column waits to be told', async () => {
      const told: [string, boolean][] = []
      const { m } = await setup({ groups: nested, onOpenChange: (href, open) => void told.push([href, open]) })
      const toggle = (href: string) => m.root.querySelector<HTMLButtonElement>(`[aria-controls="${m.root.querySelector(`a[href="${href}"]`)!.id.replace('-item-', '-sections-')}"]`)!
      await adapter.act(() => click(toggle('#select')))
      expect(toggle('#select').getAttribute('aria-expanded')).toBe('true')
      await adapter.act(() => click(toggle('#button')))
      expect(toggle('#button').getAttribute('aria-expanded')).toBe('false')
      expect(told).toEqual([['#select', true], ['#button', false]])
      if (adapter.supports.refusal) {
        const controlled = await adapter.nav({ label: 'Sections', groups: nested, open: {} }, freshTarget())
        const own = controlled.root.querySelectorAll<HTMLButtonElement>('[data-scope="nav"][data-part="toggle"]')[1]
        await adapter.act(() => click(own))
        expect(own.getAttribute('aria-expanded')).toBe('false')
        await controlled.update({ open: { '#select': true } })
        expect(own.getAttribute('aria-expanded')).toBe('true')
      }
    })
  })
}

export function paginationConformance(adapter: Adapter) {
  describe('pagination', () => {
    const setup = async (props: Partial<PaginationProps> = {}) => {
      const m = await adapter.pagination({ items: pages, ...props }, freshTarget())
      const root = () => part(m.root, 'pagination', 'root')!
      const links = () => [...m.root.querySelectorAll('[data-scope="pagination"][data-part="link"]')] as HTMLAnchorElement[]
      return { m, root, links }
    }

    it('is a named landmark around an ordered list of links', async () => {
      const { m, root, links } = await setup()
      expect(root().getAttribute('role') ?? root().tagName.toLowerCase()).toMatch(/navigation|nav/)
      expect(root().getAttribute('aria-label')).toBe('Pages')
      expect(part(m.root, 'pagination', 'list')!.tagName).toBe('OL')
      expect(links().map((link) => link.textContent?.trim())).toEqual(['Back', '1', '8', '9', 'Forward'])
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('an ellipsis is a gap, not a page', async () => {
      const { m } = await setup()
      const gap = part(m.root, 'pagination', 'gap')!
      expect(gap.tagName).not.toBe('A')
      expect(gap.getAttribute('aria-hidden')).toBe('true')
      expect(gap.textContent).toBe('…')
    })

    it('marks the current page, and keeps a spent edge reachable with aria-disabled', async () => {
      const { links } = await setup()
      const current = links().find((link) => link.getAttribute('aria-current') === 'page')!
      expect(current.textContent?.trim()).toBe('8')
      expect(current.dataset.current).toBe('')

      const forward = links()[4]
      expect(forward.getAttribute('aria-disabled')).toBe('true')
      // A link has no `disabled`, and removing it would move the focus mid-journey.
      expect(forward.hasAttribute('href')).toBe(false)
      expect(forward.hasAttribute('disabled')).toBe(false)
    })

    it('reports the page behind a link that was pressed, and says nothing for a spent edge', async () => {
      const onPageChange = vi.fn()
      const { links } = await setup({ onPageChange })
      await adapter.act(() => click(links()[3]))
      expect(onPageChange).toHaveBeenLastCalledWith(9, expect.anything())

      onPageChange.mockClear()
      await adapter.act(() => click(links()[4]))
      expect(onPageChange).not.toHaveBeenCalled()
    })
  })
}

export function stepsConformance(adapter: Adapter) {
  describe('steps', () => {
    const setup = async (props: Partial<StepsProps> = {}) => {
      const m = await adapter.steps({ items: stages, ...props }, freshTarget())
      const root = () => part(m.root, 'steps', 'root')!
      const items = () => [...m.root.querySelectorAll('[data-scope="steps"][data-part="item"]')] as HTMLElement[]
      return { m, root, items }
    }

    it('is an ordered list, so the number of a step and the total come free', async () => {
      const { m, root, items } = await setup()
      expect(root().getAttribute('role') ?? root().tagName.toLowerCase()).toMatch(/list|ol/)
      expect(items()).toHaveLength(3)
      expect(items().map((item) => part(item, 'steps', 'name')!.textContent)).toEqual(['Source', 'Check', 'Launch'])
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('every step declares its state, and the state is also a word', async () => {
      const { items } = await setup()
      expect(items().map((item) => item.dataset.state)).toEqual(['done', 'current', 'todo'])
      // The colour of a bar has no right to be the only carrier.
      expect(items().map((item) => part(item, 'steps', 'note')!.textContent)).toEqual(['done', 'now', 'waiting'])
    })

    it('the step the process is on is the one a screen reader lands on', async () => {
      const { items } = await setup()
      expect(items()[1].getAttribute('aria-current')).toBe('step')
      expect(items().filter((item) => item.hasAttribute('aria-current'))).toHaveLength(1)
    })
  })
}

export function toolbarConformance(adapter: Adapter) {
  describe('toolbar', () => {
    const setup = async (props: Partial<ToolbarProps> = {}) => {
      const m = await adapter.toolbar({ ...props }, freshTarget())
      const root = () => part(m.root, 'toolbar', 'root')!
      const buttons = () => [...m.root.querySelectorAll('[data-scope="button"][data-part="root"]')] as HTMLElement[]
      return { m, root, buttons }
    }

    it('unnamed, it is a plain strip: no role, and a tab stop per tool', async () => {
      const { m, root, buttons } = await setup()
      expect(root().hasAttribute('role')).toBe(false)
      expect(buttons().every((button) => !button.hasAttribute('tabindex'))).toBe(true)
      expect(root().dataset.orientation).toBe('horizontal')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('named, it is a toolbar: one tab stop, because the arrows move along it', async () => {
      const { root, buttons } = await setup({ label: 'Tools' })
      expect(root().getAttribute('role')).toBe('toolbar')
      expect(root().getAttribute('aria-label')).toBe('Tools')
      expect(buttons().map((button) => button.tabIndex)).toEqual([0, -1, -1])
    })

    it('carries a separator and a spacer that say nothing to a screen reader', async () => {
      const { m } = await setup({ tools: ['Move', '|', 'Rotate', '>', 'Saved'] })
      const separator = part(m.root, 'toolbar', 'separator')!
      const spacer = part(m.root, 'toolbar', 'spacer')!
      expect(separator.getAttribute('aria-hidden')).toBe('true')
      expect(spacer.getAttribute('aria-hidden')).toBe('true')
      expect(separator.textContent).toBe('')
    })

    it('turns vertical when it is told to', async () => {
      const { m, root } = await setup({ label: 'Tools' })
      await m.update({ orientation: 'vertical' })
      expect(root().dataset.orientation).toBe('vertical')
      expect(root().getAttribute('aria-orientation')).toBe('vertical')
    })
  })
}
