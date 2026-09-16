import { describe, expect, it, vi } from 'vitest'
import type { SelectItem } from '../../packages/core/src/components/select'
import { type Adapter, type SelectProps, click, freshTarget, keydown, part, parts } from './harness'

const items: SelectItem[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Bravo' },
  { value: 'c', label: 'Charlie', disabled: true },
  { value: 'd', label: 'Delta' },
]

/**
 * The DOM contract the stylesheets and screen readers depend on — anatomy, ARIA
 * wiring, keyboard routing, form participation, callbacks. Behaviour in depth is
 * covered once, against the pure machine, in select.machine.test.ts.
 */
export function selectConformance(adapter: Adapter) {
  describe('select', () => {
    const setup = async (props: Partial<SelectProps> = {}, target = freshTarget()) => {
      const m = await adapter.select({ items, label: 'Framework', placeholder: 'Pick one', ...props }, target)
      const trigger = () => part(m.root, 'select', 'trigger')!
      return {
        m,
        trigger,
        options: () => parts(m.root, 'select', 'item'),
        highlighted: () => trigger().getAttribute('aria-activedescendant'),
        key: (k: string) => adapter.act(() => keydown(trigger(), k)),
        click: (el: Element) => adapter.act(() => click(el)),
      }
    }

    describe('anatomy', () => {
      it('renders every part the stylesheets target', async () => {
        const { m, options } = await setup()
        for (const name of ['root', 'label', 'trigger', 'value', 'indicator', 'positioner', 'content']) {
          expect(part(m.root, 'select', name), `missing [data-part="${name}"]`).toBeTruthy()
        }
        expect(options()).toHaveLength(items.length)
        for (const option of options()) {
          expect(part(option, 'select', 'item-text')).toBeTruthy()
          expect(part(option, 'select', 'item-indicator')).toBeTruthy()
        }
      })

      it('names its glyphs for the theme to draw, and hides them from assistive tech', async () => {
        const { m, options } = await setup()
        const indicator = part(m.root, 'select', 'indicator')!
        expect(indicator.dataset.icon).toBe('chevron-down')
        expect(indicator.getAttribute('aria-hidden')).toBe('true')
        const check = part(options()[0], 'select', 'item-indicator')!
        expect(check.dataset.icon).toBe('check')
        expect(check.getAttribute('aria-hidden')).toBe('true')
        expect(m.root.querySelector('svg')).toBeNull()
      })

      // Regression: the vanilla renderer once rendered nothing at all for an
      // empty list, while React and Svelte rendered the empty part.
      it('renders the empty part for an empty list, and drops it when items arrive', async () => {
        const { m, options } = await setup({ items: [] })
        expect(part(m.root, 'select', 'empty')).toBeTruthy()
        expect(options()).toHaveLength(0)

        await m.update({ items })
        expect(part(m.root, 'select', 'empty')).toBeNull()
        expect(options()).toHaveLength(items.length)
      })

      it('exposes state as data attributes, not class names', async () => {
        const { m, trigger } = await setup()
        expect(m.root.querySelector('[class]')).toBeNull()
        expect(trigger().dataset.state).toBe('closed')
      })
    })

    describe('aria wiring', () => {
      it('uses the select-only combobox pattern', async () => {
        const { m, trigger } = await setup()
        expect(trigger().getAttribute('role')).toBe('combobox')
        expect(trigger().getAttribute('aria-haspopup')).toBe('listbox')
        expect(trigger().getAttribute('aria-expanded')).toBe('false')
        expect(trigger().getAttribute('aria-controls')).toBe(part(m.root, 'select', 'content')!.id)
        expect(part(m.root, 'select', 'content')!.getAttribute('role')).toBe('listbox')
      })

      it('points aria-activedescendant at the highlighted option while open', async () => {
        const { trigger, options, highlighted, key, click } = await setup()
        await click(trigger())
        expect(trigger().getAttribute('aria-expanded')).toBe('true')
        expect(highlighted()).toBe(options()[0].id)
        await key('ArrowDown')
        expect(highlighted()).toBe(options()[1].id)
      })

      it('marks options with aria-selected and aria-disabled', async () => {
        const { trigger, options, click } = await setup()
        await click(trigger())
        await click(options()[1])
        expect(options()[1].getAttribute('aria-selected')).toBe('true')
        expect(options()[0].getAttribute('aria-selected')).toBe('false')
        expect(options()[2].getAttribute('aria-disabled')).toBe('true')
      })
    })

    describe('keyboard', () => {
      it('opens on Enter and selects on Enter', async () => {
        const onValueChange = vi.fn()
        const { trigger, key } = await setup({ onValueChange })
        await key('Enter')
        expect(trigger().dataset.state).toBe('open')
        await key('ArrowDown')
        await key('Enter')
        expect(trigger().dataset.state).toBe('closed')
        expect(onValueChange).toHaveBeenCalledWith('b', expect.objectContaining({ value: 'b' }))
        expect(trigger().textContent).toContain('Bravo')
      })

      it('closes on Escape without changing the value', async () => {
        const onValueChange = vi.fn()
        const { trigger, key } = await setup({ onValueChange })
        await key('Enter')
        await key('ArrowDown')
        await key('Escape')
        expect(trigger().dataset.state).toBe('closed')
        expect(onValueChange).not.toHaveBeenCalled()
      })

      it('skips disabled options', async () => {
        const { options, highlighted, key } = await setup()
        await key('Enter')
        await key('End')
        expect(highlighted()).toBe(options()[3].id)
        await key('ArrowUp')
        expect(highlighted()).toBe(options()[1].id)
      })

      it('removes data-highlighted from the option it leaves', async () => {
        const { options, key } = await setup()
        await key('Enter')
        expect(options()[0].hasAttribute('data-highlighted')).toBe(true)
        await key('ArrowDown')
        expect(options()[0].hasAttribute('data-highlighted')).toBe(false)
        expect(options()[1].hasAttribute('data-highlighted')).toBe(true)
      })
    })

    describe('form participation', () => {
      it('submits the value through a hidden input when named', async () => {
        const form = freshTarget('form') as HTMLFormElement
        await setup({ name: 'framework', defaultValue: 'd' }, form)
        expect(new FormData(form).get('framework')).toBe('d')
      })
    })

    describe('callbacks', () => {
      it('reports the chosen value with its resolved item, once', async () => {
        const onValueChange = vi.fn()
        const { trigger, options, click } = await setup({ onValueChange })
        await click(trigger())
        await click(options()[3])
        expect(onValueChange).toHaveBeenCalledTimes(1)
        expect(onValueChange).toHaveBeenCalledWith('d', expect.objectContaining(items[3]))
      })
    })

    describe('controlled', () => {
      const run = adapter.supports.controlled ? it : it.skip

      // Regression: the first machine diffed `value` to decide when to report, so
      // a controlled select — whose value never moves on its own — was inert.
      run('reports the user\'s choice but shows only what the owner passes', async () => {
        const onValueChange = vi.fn()
        const { m, trigger, options, click } = await setup({ value: 'a', onValueChange })
        await click(trigger())
        await click(options()[3])
        expect(onValueChange).toHaveBeenCalledWith('d', expect.objectContaining({ value: 'd' }))
        expect(trigger().textContent).toContain('Alpha')

        await m.update({ value: 'd' })
        expect(trigger().textContent).toContain('Delta')
      })

      run('does not echo a value the owner pushes in', async () => {
        const onValueChange = vi.fn()
        const { m } = await setup({ value: 'a', onValueChange })
        await m.update({ value: 'b' })
        expect(onValueChange).not.toHaveBeenCalled()
      })
    })
  })
}
