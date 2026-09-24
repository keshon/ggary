import { describe, expect, it, vi } from 'vitest'
import { type Adapter, type ListProps, click, freshTarget, part, parts } from './harness'

const people: ListProps['items'] = [
  { title: 'Anna Petrova', description: 'Approved the budget change', meta: '2h', action: 'More' },
  { title: 'Mark Chen', description: 'Asked for changes', meta: '5h', action: 'More' },
]

/**
 * List: a named list of rows. A plain row is text; a row with `href` is a
 * link and one with `onSelect` a button, named by its title, described by its
 * line, stretched over the row, with its own actions still pressed as
 * themselves. "Show more" stays focusable while it loads, says a failure, and
 * hands the focus to the first row that came.
 */
export function listConformance(adapter: Adapter) {
  describe('list', () => {
    const setup = async (props: Partial<ListProps> = {}) => {
      const m = await adapter.list({ label: 'Reviewers', count: '2 of 16', items: people, ...props }, freshTarget())
      const items = () => part(m.root, 'list', 'items')!
      const rows = () => parts(m.root, 'list', 'item')
      const target = (index: number) => part(rows()[index], 'list', 'target')
      const more = () => part(m.root, 'list', 'more') as HTMLButtonElement | null
      return { m, items, rows, target, more }
    }

    it('is a list named by its heading, a row an item; a plain row’s title is text', async () => {
      const { m, items, rows, target } = await setup()
      expect(items().tagName).toBe('UL')
      expect(items().getAttribute('role')).toBe('list')
      expect(items().getAttribute('aria-labelledby')).toBe(part(m.root, 'list', 'title')!.id)
      expect(part(m.root, 'list', 'title')!.textContent).toBe('Reviewers')
      expect(part(m.root, 'list', 'count')!.textContent).toBe('2 of 16')
      expect(rows().map((row) => row.tagName)).toEqual(['LI', 'LI'])
      expect(target(0)).toBeNull()
      expect(part(rows()[0], 'list', 'item-title')!.textContent).toBe('Anna Petrova')
      expect(part(rows()[0], 'list', 'description')!.textContent).toBe('Approved the budget change')
      expect(part(rows()[0], 'list', 'meta')!.textContent).toBe('2h')
      expect(rows()[0].hasAttribute('data-interactive')).toBe(false)
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('without a heading, the list takes the name it is given', async () => {
      const { items } = await setup({ label: undefined, count: undefined, ariaLabel: 'Reviewers' })
      expect(items().getAttribute('aria-label')).toBe('Reviewers')
      expect(items().hasAttribute('aria-labelledby')).toBe(false)
    })

    it('a row with href is a link named by its title and described by its line; the current one says so', async () => {
      const { rows, target } = await setup({
        items: [
          { title: 'Anna Petrova', description: 'Approved', href: '/people/anna' },
          { title: 'Mark Chen', href: '/people/mark', current: 'page' },
          { title: 'Tom Øberg', href: '/people/tom', disabled: true },
        ],
      })
      const link = target(0) as HTMLAnchorElement
      expect(link.tagName).toBe('A')
      expect(link.getAttribute('href')).toBe('/people/anna')
      expect(link.textContent).toBe('Anna Petrova')
      expect(link.getAttribute('aria-describedby')).toBe(part(rows()[0], 'list', 'description')!.id)
      expect(rows()[0].hasAttribute('data-interactive')).toBe(true)
      expect(target(1)!.getAttribute('aria-current')).toBe('page')
      expect(rows()[1].hasAttribute('data-current')).toBe(true)
      expect(target(2)!.hasAttribute('href')).toBe(false)
      expect(target(2)!.getAttribute('aria-disabled')).toBe('true')
    })

    it('a row with onSelect is a button; its own action is pressed as itself', async () => {
      const onSelect = vi.fn()
      const onAction = vi.fn()
      const { rows, target } = await setup({ items: people.map((item) => ({ ...item, press: true })), onSelect, onAction })
      const button = target(1) as HTMLButtonElement
      expect(button.tagName).toBe('BUTTON')
      expect(button.type).toBe('button')
      await adapter.act(() => click(button))
      expect(onSelect).toHaveBeenCalledWith('Mark Chen')
      await adapter.act(() => click(part(rows()[1], 'list', 'actions')!.querySelector('button')!))
      expect(onAction).toHaveBeenCalledWith('Mark Chen')
      expect(onSelect).toHaveBeenCalledTimes(1)
    })

    it('Show more waits for its answer, stays focusable, and gives the focus to the first new row', async () => {
      let finish = () => {}
      const onLoadMore = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)))
      const { m, rows, more } = await setup({ onLoadMore, words: { more: 'Show 14 more' }, items: people.map((item) => ({ ...item, href: '#' })) })
      expect(more()!.textContent).toBe('Show 14 more')
      await adapter.act(() => more()!.focus())
      await adapter.act(() => click(more()!))
      await adapter.wait(0)
      expect(onLoadMore).toHaveBeenCalledTimes(1)
      expect(more()!.getAttribute('aria-disabled')).toBe('true')
      expect(more()!.disabled).toBe(false)
      expect(more()!.textContent).toBe('Loading…')
      await adapter.act(() => click(more()!))
      expect(onLoadMore).toHaveBeenCalledTimes(1)
      await m.update({ items: [...people, { title: 'Leila Haddad', href: '#' }, { title: 'Tom Øberg', href: '#' }].map((item) => ({ ...item, href: '#' })), hasMore: false })
      await adapter.act(() => finish())
      await adapter.wait(0)
      await adapter.wait(0)
      expect(rows()).toHaveLength(4)
      expect(more()).toBeNull()
      expect(document.activeElement).toBe(part(rows()[2], 'list', 'target'))
    })

    it('a failed load says so where the button is, and the button offers to try again', async () => {
      const onLoadMore = vi.fn(() => Promise.reject(new Error('offline')))
      const { m, more } = await setup({ onLoadMore })
      await adapter.act(() => click(more()!))
      await adapter.wait(0)
      await adapter.wait(0)
      expect(more()!.textContent).toBe('Try again')
      const error = part(m.root, 'list', 'more-error')!
      expect(error.getAttribute('role')).toBe('status')
      expect(error.textContent).toBe("Couldn't load more")
      expect(more()!.getAttribute('aria-describedby')).toBe(error.id)
    })

    it('draws the variant it is given', async () => {
      const { m, items } = await setup({ variant: 'cards' })
      expect(part(m.root, 'list', 'root')!.dataset.variant).toBe('cards')
      expect(items().dataset.variant).toBe('cards')
    })
  })
}
