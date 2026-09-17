import { describe, expect, it } from 'vitest'
import { type Adapter, click, freshTarget, part, parts } from './harness'

/**
 * A native form reset rewrites values and checked states without firing an
 * event. Every component that derived something from them — its own state,
 * data-state, a shown error, a select's displayed value — has to follow.
 * Before this spec, none of them did.
 */
export function resetConformance(adapter: Adapter) {
  describe('form reset', () => {
    const form = () => freshTarget('form') as HTMLFormElement
    // The reset is applied a task after the event; components follow a task later.
    const reset = async (target: HTMLFormElement) => {
      await adapter.act(() => target.reset())
      await new Promise((resolve) => setTimeout(resolve, 20))
      await adapter.act(() => {})
    }

    it('a field forgets the error it was showing', async () => {
      const target = form()
      const m = await adapter.field({ label: 'Email', required: true, error: 'Enter your email' }, target)
      const input = part(m.root, 'input', 'root') as HTMLInputElement
      await adapter.act(() => {
        input.focus()
        input.blur()
      })
      expect(part(m.root, 'field', 'error')!.hidden).toBe(false)
      await reset(target)
      expect(part(m.root, 'field', 'error')!.hidden).toBe(true)
      expect(input.hasAttribute('aria-invalid')).toBe(false)
    })

    it('a fieldset forgets the error it was showing', async () => {
      const target = form()
      const m = await adapter.fieldset(
        { legend: 'Plan', required: true, error: 'Choose a plan', group: 'radio', items: [{ value: 'a', label: 'A' }], name: 'plan' },
        target
      )
      await adapter.act(() => {
        target.checkValidity()
      })
      expect(part(m.root, 'fieldset', 'error')!.hidden).toBe(false)
      await reset(target)
      expect(part(m.root, 'fieldset', 'error')!.hidden).toBe(true)
    })

    for (const kind of ['checkbox', 'switch'] as const) {
      it(`a ${kind} goes back to how it started, and draws it`, async () => {
        const target = form()
        const m = kind === 'checkbox'
          ? await adapter.checkbox({ label: 'Subscribe', name: 'subscribe' }, target)
          : await adapter.switch({ label: 'Subscribe', name: 'subscribe' }, target)
        const input = part(m.root, kind, 'input') as HTMLInputElement
        await adapter.act(() => click(input))
        expect(part(m.root, kind, 'root')!.dataset.state).toBe('checked')
        await reset(target)
        expect(input.checked).toBe(false)
        expect(part(m.root, kind, 'root')!.dataset.state).toBe('unchecked')
        // And it still works afterwards: state and DOM agree again.
        await adapter.act(() => click(input))
        expect(input.checked).toBe(true)
        expect(part(m.root, kind, 'root')!.dataset.state).toBe('checked')
      })
    }

    it('a box checked by default is still checked after a reset nobody changed anything before', async () => {
      // The trap: a renderer that sets `checked` as a property never writes the
      // attribute, so the browser resets the box to UNchecked, and a component
      // whose state never changed does not notice.
      const target = form()
      const m = await adapter.checkbox({ label: 'Subscribe', name: 'subscribe', defaultChecked: true }, target)
      const input = part(m.root, 'checkbox', 'input') as HTMLInputElement
      expect(input.checked).toBe(true)
      await reset(target)
      expect(input.checked).toBe(true)
      expect(part(m.root, 'checkbox', 'root')!.dataset.state).toBe('checked')
      expect(new FormData(target).get('subscribe')).toBe('on')
    })

    it('a radio group goes back to its default', async () => {
      const target = form()
      const m = await adapter.radioGroup(
        { name: 'plan', defaultValue: 'free', items: [{ value: 'free', label: 'Free' }, { value: 'pro', label: 'Pro' }] },
        target
      )
      const options = () => parts(m.root, 'radio', 'root')
      await adapter.act(() => click(options()[1]))
      expect(new FormData(target).get('plan')).toBe('pro')
      await reset(target)
      expect(new FormData(target).get('plan')).toBe('free')
      expect(options().map((option) => option.dataset.state)).toEqual(['checked', 'unchecked'])
    })

    it('a checkbox group goes back to its default, and its "at least one" with it', async () => {
      const target = form()
      const m = await adapter.checkboxGroup(
        { name: 'tags', required: true, items: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] },
        target
      )
      const inputs = () => parts(m.root, 'checkbox', 'input') as HTMLInputElement[]
      await adapter.act(() => click(inputs()[0]))
      expect(target.checkValidity()).toBe(true)
      await reset(target)
      expect(inputs().map((input) => input.checked)).toEqual([false, false])
      expect(parts(m.root, 'checkbox', 'root').map((option) => option.dataset.state)).toEqual(['unchecked', 'unchecked'])
      expect(target.checkValidity()).toBe(false)
    })

    it('a select goes back to its default value, shown and submitted', async () => {
      const target = form()
      const items = [
        { value: 'a', label: 'Alpha' },
        { value: 'b', label: 'Bravo' },
      ]
      const m = await adapter.select({ items, name: 'pick', defaultValue: 'a', label: 'Pick' }, target)
      const trigger = () => part(m.root, 'select', 'trigger')!
      await adapter.act(() => click(trigger()))
      await adapter.act(() => click(parts(m.root, 'select', 'item')[1]))
      expect(trigger().textContent).toContain('Bravo')
      await reset(target)
      expect(trigger().textContent).toContain('Alpha')
      expect(new FormData(target).get('pick')).toBe('a')
    })
  })
}
