import { describe, expect, it } from 'vitest'
import { type Adapter, type AccordionProps, type ProgressProps, type TreeProps, click, freshTarget, keydown, part, parts } from './harness'
import { files, sections } from './files'

/**
 * Accordion, Tree and Progress in each framework: the same roles, names and
 * states from the same core, the keyboard moving real focus, and the page's
 * own props reaching the element.
 */
export function disclosureConformance(adapter: Adapter) {
  const press = (key: string) => adapter.act(() => void keydown(document.activeElement!, key))

  const accordion = adapter.accordion ? describe : describe.skip
  accordion('accordion', () => {
    const setup = async (props: Partial<AccordionProps> = {}) => {
      const changes: string[][] = []
      const m = await adapter.accordion!({ items: sections, onValueChange: (value) => changes.push(value), ...props }, freshTarget())
      const triggers = () => parts(m.root, 'accordion', 'trigger') as HTMLButtonElement[]
      const contents = () => parts(m.root, 'accordion', 'content')
      return { m, triggers, contents, changes }
    }

    it('is headings over buttons, each naming and showing its own region', async () => {
      const { m, triggers, contents } = await setup({ headingLevel: 2 })
      const headings = parts(m.root, 'accordion', 'heading')
      expect(headings.map((heading) => [heading.getAttribute('role'), heading.getAttribute('aria-level')])).toEqual(Array(4).fill(['heading', '2']))
      const [first] = triggers()
      expect(first.tagName).toBe('BUTTON')
      expect(first.getAttribute('aria-expanded')).toBe('false')
      expect(first.getAttribute('aria-controls')).toBe(contents()[0].id)
      const text = (ids: string | null) => ids!.split(' ').map((id) => document.getElementById(id)!.textContent).join(' ')
      expect(text(first.getAttribute('aria-labelledby'))).toBe('Shipping')
      expect(text(first.getAttribute('aria-describedby'))).toBe('Where and how fast')
      expect(triggers()[1].hasAttribute('aria-describedby')).toBe(false)
      expect(contents()[0].getAttribute('role')).toBe('region')
      expect(contents()[0].getAttribute('aria-labelledby')).toBe(first.id)
      expect(contents()[0].hasAttribute('hidden')).toBe(true)
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('a press opens a section and closes the other; its body is there, hidden, before', async () => {
      const { triggers, contents, changes } = await setup()
      expect(contents()[1].textContent).toContain('Body Returns')
      await adapter.act(() => click(triggers()[0]))
      await adapter.act(() => click(triggers()[1]))
      expect(changes).toEqual([['shipping'], ['returns']])
      expect(triggers().map((trigger) => trigger.getAttribute('aria-expanded'))).toEqual(['false', 'true', 'false', 'false'])
      expect(contents()[1].hasAttribute('hidden')).toBe(false)
      expect(contents()[0].hasAttribute('hidden')).toBe(true)
    })

    it('the arrows move the focus between buttons, over a disabled one; Home and End', async () => {
      const { triggers } = await setup()
      triggers()[1].focus()
      await adapter.act(() => {})
      await press('ArrowDown')
      expect(document.activeElement).toBe(triggers()[3])
      await press('Home')
      expect(document.activeElement).toBe(triggers()[0])
      await press('ArrowUp')
      expect(document.activeElement).toBe(triggers()[3])
      expect(triggers()[2].getAttribute('aria-disabled')).toBe('true')
    })

    it('not collapsible: the open section stays and its button says so', async () => {
      const { triggers, changes } = await setup({ collapsible: false, defaultValue: ['returns'] })
      await adapter.act(() => click(triggers()[1]))
      expect(changes).toEqual([])
      expect(triggers()[1].getAttribute('aria-disabled')).toBe('true')
    })
  })

  const tree = adapter.tree ? describe : describe.skip
  tree('tree', () => {
    const setup = async (props: Partial<TreeProps> = {}) => {
      const changes: string[][] = []
      const opened: string[][] = []
      const m = await adapter.tree!({ items: files, label: 'Files', onValueChange: (value) => changes.push(value), onExpandedChange: (value) => opened.push(value), ...props }, freshTarget())
      const items = () => parts(m.root, 'tree', 'item')
      const item = (value: string) => items().find((row) => row.dataset.value === value)!
      const texts = () => items().map((row) => part(row, 'tree', 'item-text')!.textContent)
      return { m, items, item, texts, changes, opened }
    }

    it('is a named tree of rows saying their level, place, and whether they are open', async () => {
      const { m, item, texts } = await setup({ defaultExpanded: ['src'] })
      const root = part(m.root, 'tree', 'root') ?? m.root
      expect(root.getAttribute('role')).toBe('tree')
      expect(root.getAttribute('aria-label')).toBe('Files')
      expect(texts()).toEqual(['src', 'app', 'lib', 'index.ts', 'secrets', 'tests', 'README.md'])
      const lib = item('src/lib')
      expect([lib.getAttribute('role'), lib.getAttribute('aria-level'), lib.getAttribute('aria-posinset'), lib.getAttribute('aria-setsize'), lib.getAttribute('aria-expanded')]).toEqual(['treeitem', '2', '2', '3', 'false'])
      expect(item('readme').hasAttribute('aria-expanded')).toBe(false)
      expect(item('secrets').getAttribute('aria-disabled')).toBe('true')
      expect(item('src').getAttribute('tabindex')).toBe('0')
      expect(item('src/app').getAttribute('tabindex')).toBe('-1')
      expect(lib.style.getPropertyValue('--gg-tree-level')).toBe('2')
    })

    it('the keyboard opens, steps in, steps out and closes, the focus following', async () => {
      const { item, texts, opened } = await setup()
      item('src').focus()
      await adapter.act(() => {})
      await press('ArrowRight')
      expect(texts()).toContain('app')
      expect(document.activeElement).toBe(item('src'))
      await press('ArrowRight')
      expect(document.activeElement).toBe(item('src/app'))
      await press('End')
      expect(document.activeElement).toBe(item('readme'))
      await press('Home')
      await press('ArrowLeft')
      expect(texts()).not.toContain('app')
      expect(opened).toEqual([['src'], []])
    })

    it('a press on a branch’s row chooses it and opens it; again, closes it', async () => {
      const { item, texts, changes } = await setup()
      await adapter.act(() => click(item('src')))
      expect(texts()).toContain('app')
      expect(changes).toEqual([['src']])
      await adapter.act(() => click(item('src')))
      expect(texts()).not.toContain('app')
    })

    it('a press on a leaf chooses it; a press on a chevron only opens its branch', async () => {
      const { item, texts, changes } = await setup()
      await adapter.act(() => click(part(item('tests'), 'tree', 'toggle')!))
      expect(texts()).toContain('app.test.ts')
      expect(changes).toEqual([])
      await adapter.act(() => click(item('tests/app.test.ts')))
      expect(changes).toEqual([['tests/app.test.ts']])
      expect(item('tests/app.test.ts').getAttribute('aria-selected')).toBe('true')
    })

    it('closing a branch with the focus inside it brings the focus up to the branch', async () => {
      const { item } = await setup({ defaultExpanded: ['src', 'src/app'] })
      item('src/app/main.ts').focus()
      await adapter.act(() => {})
      await adapter.act(() => click(part(item('src'), 'tree', 'toggle')!))
      expect(document.activeElement).toBe(item('src'))
    })

    it('multiple: each row says whether it is chosen, and the tree says it takes several', async () => {
      const { m, item } = await setup({ selectionMode: 'multiple' })
      await adapter.act(() => click(item('readme')))
      await adapter.act(() => click(item('tests')))
      expect((part(m.root, 'tree', 'root') ?? m.root).getAttribute('aria-multiselectable')).toBe('true')
      expect(['src', 'tests', 'readme'].map((value) => item(value).getAttribute('aria-selected'))).toEqual(['false', 'true', 'true'])
    })
  })

  const progress = adapter.progress ? describe : describe.skip
  progress('progress', () => {
    const setup = (props: ProgressProps) => adapter.progress!(props, freshTarget())
    const track = (root: Element) => part(root, 'progress', 'track')!

    it('is a progressbar named by its label, with its value in words', async () => {
      const m = await setup({ value: 42, label: 'Uploading', locale: 'en-US' })
      const bar = track(m.root)
      expect(bar.getAttribute('role')).toBe('progressbar')
      expect(document.getElementById(bar.getAttribute('aria-labelledby')!)!.textContent).toBe('Uploading')
      expect([bar.getAttribute('aria-valuenow'), bar.getAttribute('aria-valuemin'), bar.getAttribute('aria-valuemax'), bar.getAttribute('aria-valuetext')]).toEqual(['42', '0', '100', '42%'])
      expect(part(m.root, 'progress', 'value-text')!.textContent).toBe('42%')
      expect(bar.style.getPropertyValue('--gg-progress')).toBe('0.42')
    })

    it('without a value it is indeterminate and says no amount', async () => {
      const m = await setup({ label: 'Preparing' })
      const bar = track(m.root)
      expect(bar.hasAttribute('aria-valuenow')).toBe(false)
      expect(bar.getAttribute('data-state')).toBe('indeterminate')
      expect(part(m.root, 'progress', 'value-text')).toBeNull()
    })

    it('a hidden label still names it; a ring follows the new value', async () => {
      const m = await setup({ value: 1, max: 4, label: 'Steps', hideLabel: true, shape: 'ring' })
      expect(part(m.root, 'progress', 'label')).toBeNull()
      expect(track(m.root).getAttribute('aria-label')).toBe('Steps')
      await m.update({ value: 4 })
      expect(track(m.root).getAttribute('aria-valuenow')).toBe('4')
      expect(track(m.root).getAttribute('data-state')).toBe('complete')
    })
  })
}
