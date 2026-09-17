import { describe, expect, it, vi } from 'vitest'
import { type Adapter, type RadioGroupProps, click, freshTarget, part } from './harness'

const items = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'team', label: 'Team', disabled: true },
]

/** Native radios under a radiogroup: the keyboard is the browser's, so it is not re-tested here. */
export function radioGroupConformance(adapter: Adapter) {
  describe('radio group', () => {
    const setup = async (props: Partial<RadioGroupProps> = {}, target = freshTarget()) => {
      const m = await adapter.radioGroup({ items, label: 'Plan', ...props }, target)
      const inputs = () => [...m.root.querySelectorAll('[data-scope="radio"][data-part="input"]')] as HTMLInputElement[]
      const options = () => [...m.root.querySelectorAll('[data-scope="radio"][data-part="root"]')] as HTMLElement[]
      return { m, inputs, options, group: () => part(m.root, 'radio-group', 'root')! }
    }

    it('is a radiogroup named by its label, with one labelled option per item', async () => {
      const { m, group, options, inputs } = await setup()
      expect(group().getAttribute('role')).toBe('radiogroup')
      expect(group().getAttribute('aria-labelledby')).toBe(part(m.root, 'radio-group', 'label')!.id)
      expect(part(m.root, 'radio-group', 'label')!.textContent).toBe('Plan')
      expect(options().map((option) => option.tagName)).toEqual(['LABEL', 'LABEL', 'LABEL'])
      expect(options().map((option) => part(option, 'radio', 'label')!.textContent?.trim())).toEqual(['Free', 'Pro', 'Team'])
      expect(inputs().map((input) => input.type)).toEqual(['radio', 'radio', 'radio'])
      expect(part(m.root, 'radio', 'indicator')!.getAttribute('aria-hidden')).toBe('true')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('shares one name across the options, which is what makes them one group', async () => {
      const named = await setup({ name: 'plan' })
      expect(named.inputs().map((input) => input.name)).toEqual(['plan', 'plan', 'plan'])

      const unnamed = await setup()
      const names = new Set(unnamed.inputs().map((input) => input.name))
      expect(names.size).toBe(1)
      expect([...names][0]).not.toBe('')
    })

    it('starts from defaultValue, and moves the check and the state on a click', async () => {
      const onValueChange = vi.fn()
      const { inputs, options } = await setup({ defaultValue: 'free', onValueChange })
      expect(inputs()[0].checked).toBe(true)
      expect(options()[0].dataset.state).toBe('checked')

      await adapter.act(() => click(options()[1]))
      expect(onValueChange).toHaveBeenLastCalledWith('pro')
      expect(inputs()[1].checked).toBe(true)
      expect(inputs()[0].checked).toBe(false)
      expect(options()[1].dataset.state).toBe('checked')
      expect(options()[0].dataset.state).toBe('unchecked')
    })

    it('submits the chosen value under the group name', async () => {
      const form = freshTarget('form') as HTMLFormElement
      const { options } = await setup({ name: 'plan', defaultValue: 'free' }, form)
      expect(new FormData(form).get('plan')).toBe('free')
      await adapter.act(() => click(options()[1]))
      expect(new FormData(form).get('plan')).toBe('pro')
    })

    it('a disabled option cannot be chosen; a disabled group disables every option', async () => {
      const onValueChange = vi.fn()
      const { inputs, options } = await setup({ onValueChange })
      expect(inputs()[2].disabled).toBe(true)
      await adapter.act(() => click(options()[2]))
      expect(onValueChange).not.toHaveBeenCalled()

      const { m, group, inputs: all } = await setup({ disabled: true })
      expect(all().every((input) => input.disabled)).toBe(true)
      expect(group().getAttribute('aria-disabled')).toBe('true')
      await m.update({ disabled: false })
      expect(all().map((input) => input.disabled)).toEqual([false, false, true])
    })

    it('required and invalid are the group’s, and required reaches the inputs', async () => {
      const { m, group, inputs } = await setup({ required: true, invalid: true })
      expect(group().getAttribute('aria-required')).toBe('true')
      expect(group().getAttribute('aria-invalid')).toBe('true')
      expect(inputs().every((input) => input.required)).toBe(true)
      await m.update({ invalid: false })
      expect(group().hasAttribute('aria-invalid')).toBe(false)
    })

    it('lays out by orientation, vertical by default', async () => {
      const { m } = await setup()
      const list = () => part(m.root, 'radio-group', 'list')!
      expect(list().dataset.orientation).toBe('vertical')
      await m.update({ orientation: 'horizontal' })
      expect(list().dataset.orientation).toBe('horizontal')
    })

    const controlled = adapter.supports.controlled ? it : it.skip
    controlled('follows a value pushed by the owner, including none', async () => {
      const { m, inputs } = await setup({ value: 'free', onValueChange: vi.fn() })
      await m.update({ value: 'pro' })
      expect(inputs()[1].checked).toBe(true)
      await m.update({ value: null })
      expect(inputs().some((input) => input.checked)).toBe(false)
    })
  })
}
