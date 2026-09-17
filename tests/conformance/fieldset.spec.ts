import { describe, expect, it, vi } from 'vitest'
import { type Adapter, type CheckboxGroupProps, type FieldsetProps, click, freshTarget, part } from './harness'

const interests = [
  { value: 'design', label: 'Design' },
  { value: 'code', label: 'Code' },
  { value: 'research', label: 'Research', disabled: true },
]

/** CheckboxGroup: RadioGroup's frame with a value array, and "required" meaning at least one. */
export function checkboxGroupConformance(adapter: Adapter) {
  describe('checkbox group', () => {
    const setup = async (props: Partial<CheckboxGroupProps> = {}, target = freshTarget()) => {
      const m = await adapter.checkboxGroup({ items: interests, label: 'Interests', ...props }, target)
      const inputs = () => [...m.root.querySelectorAll('[data-scope="checkbox"][data-part="input"]')] as HTMLInputElement[]
      const options = () => [...m.root.querySelectorAll('[data-scope="checkbox"][data-part="root"]')] as HTMLElement[]
      return { m, inputs, options, group: () => part(m.root, 'checkbox-group', 'root')! }
    }

    it('is a group named by its label, of checkboxes that share one name', async () => {
      const { m, group, inputs, options } = await setup()
      expect(group().getAttribute('role')).toBe('group')
      expect(group().getAttribute('aria-labelledby')).toBe(part(m.root, 'checkbox-group', 'label')!.id)
      expect(inputs().map((input) => input.type)).toEqual(['checkbox', 'checkbox', 'checkbox'])
      expect(new Set(inputs().map((input) => input.name)).size).toBe(1)
      expect(options().map((option) => option.tagName)).toEqual(['LABEL', 'LABEL', 'LABEL'])
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('starts from defaultValue and reports the checked values in item order', async () => {
      const onValueChange = vi.fn()
      const { inputs, options } = await setup({ defaultValue: ['code'], onValueChange })
      expect(inputs().map((input) => input.checked)).toEqual([false, true, false])
      await adapter.act(() => click(options()[0]))
      expect(onValueChange).toHaveBeenLastCalledWith(['design', 'code'])
      await adapter.act(() => click(inputs()[1]))
      expect(onValueChange).toHaveBeenLastCalledWith(['design'])
      expect(options()[0].dataset.state).toBe('checked')
      expect(options()[1].dataset.state).toBe('unchecked')
    })

    it('submits every checked value under the group name', async () => {
      const form = freshTarget('form') as HTMLFormElement
      const { inputs } = await setup({ name: 'interests', defaultValue: ['design'] }, form)
      await adapter.act(() => click(inputs()[1]))
      expect(new FormData(form).getAll('interests')).toEqual(['design', 'code'])
    })

    it('required means at least one: the form is invalid with none, valid with one', async () => {
      const form = freshTarget('form') as HTMLFormElement
      const { inputs, group } = await setup({ required: true }, form)
      expect(group().getAttribute('aria-required')).toBe('true')
      expect(inputs().some((input) => input.required)).toBe(false)
      expect(form.checkValidity()).toBe(false)
      await adapter.act(() => click(inputs()[1]))
      expect(form.checkValidity()).toBe(true)
      await adapter.act(() => click(inputs()[1]))
      expect(form.checkValidity()).toBe(false)
    })

    it('disables a disabled option, or every option of a disabled group', async () => {
      const { inputs } = await setup()
      expect(inputs().map((input) => input.disabled)).toEqual([false, false, true])
      const { m, inputs: all } = await setup({ disabled: true })
      expect(all().every((input) => input.disabled)).toBe(true)
      await m.update({ disabled: false })
      expect(all().map((input) => input.disabled)).toEqual([false, false, true])
    })

    const controlled = adapter.supports.controlled ? it : it.skip
    controlled('follows a value pushed by the owner', async () => {
      const { m, inputs } = await setup({ value: [], onValueChange: vi.fn() })
      await m.update({ value: ['design', 'code'] })
      expect(inputs().map((input) => input.checked)).toEqual([true, true, false])
    })
  })
}

/**
 * Fieldset: a legend, a hint-or-error slot, and Field's validation timing for a
 * group — touched when focus leaves the group, shown on a submit attempt.
 */
export function fieldsetConformance(adapter: Adapter) {
  describe('fieldset', () => {
    const plans = [
      { value: 'free', label: 'Free' },
      { value: 'pro', label: 'Pro' },
    ]

    const setup = async (props: Partial<FieldsetProps> = {}) => {
      const form = freshTarget('form') as HTMLFormElement
      const outside = document.createElement('button')
      outside.type = 'button'
      outside.textContent = 'Outside'
      const m = await adapter.fieldset({ group: 'radio', items: plans, name: 'plan', legend: 'Plan', ...props }, form)
      form.append(outside)
      const root = () => part(m.root, 'fieldset', 'root') as HTMLFieldSetElement
      const inputs = () => [...root().querySelectorAll('input')] as HTMLInputElement[]
      return {
        m,
        form,
        root,
        inputs,
        legend: () => part(m.root, 'fieldset', 'legend')!,
        hint: () => part(m.root, 'fieldset', 'hint'),
        error: () => part(m.root, 'fieldset', 'error')!,
        // Focus leaving the group for something outside it.
        leave: () =>
          adapter.act(() => {
            inputs()[0].focus()
            inputs()[0].dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }))
            outside.focus()
          }),
      }
    }

    it('is a native fieldset named by its legend; the group inside does not name itself again', async () => {
      const { m, root, legend } = await setup({ hint: 'Change it any time' })
      expect(root().tagName).toBe('FIELDSET')
      expect(legend().tagName).toBe('LEGEND')
      expect(legend().textContent).toBe('Plan')
      expect(root().getAttribute('aria-describedby')).toBe(part(m.root, 'fieldset', 'hint')!.id)
      expect(part(m.root, 'radio-group', 'root')!.hasAttribute('role')).toBe(false)
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('required: shows no error until the group is left, then shows it in place of the hint', async () => {
      const { root, inputs, hint, error, leave } = await setup({ required: true, hint: 'Pick one', error: 'Choose a plan' })
      expect(inputs().every((input) => input.required)).toBe(true)
      expect(error().hidden).toBe(true)
      await leave()
      expect(error().hidden).toBe(false)
      expect(error().textContent).toBe('Choose a plan')
      expect(hint()!.hidden).toBe(true)
      expect(root().getAttribute('aria-describedby')).toBe(error().id)
      expect(inputs().every((input) => input.getAttribute('aria-invalid') === 'true')).toBe(true)
    })

    it('moving between its own options is not leaving it', async () => {
      const { inputs, error } = await setup({ required: true, error: 'Choose a plan' })
      await adapter.act(() => {
        inputs()[0].focus()
        inputs()[0].dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: inputs()[1] }))
      })
      expect(error().hidden).toBe(true)
    })

    it('a submit attempt shows the error at once, and choosing clears it', async () => {
      const { form, inputs, error } = await setup({ required: true, error: 'Choose a plan' })
      await adapter.act(() => {
        form.checkValidity()
      })
      expect(error().hidden).toBe(false)
      await adapter.act(() => click(inputs()[1]))
      expect(error().hidden).toBe(true)
      expect(inputs().some((input) => input.hasAttribute('aria-invalid'))).toBe(false)
    })

    it('a checkbox group inside: at least one, with the same timing', async () => {
      const { form, inputs, error } = await setup({ group: 'checkbox', name: 'plans', required: true, error: 'Pick at least one' })
      await adapter.act(() => {
        form.checkValidity()
      })
      expect(error().textContent).toBe('Pick at least one')
      await adapter.act(() => click(inputs()[0]))
      expect(error().hidden).toBe(true)
    })

    it('disabled: the native attribute disables every control inside', async () => {
      const { m, root, inputs, legend } = await setup({ disabled: true })
      expect(root().disabled).toBe(true)
      expect(inputs().every((input) => input.matches(':disabled'))).toBe(true)
      expect(legend().hasAttribute('data-disabled')).toBe(true)
      await m.update({ disabled: false })
      expect(inputs().some((input) => input.matches(':disabled'))).toBe(false)
    })

    it('an owner-declared invalid shows at once, and clears when the owner says so', async () => {
      const { m, error } = await setup({ invalid: true, error: 'That plan is not available' })
      expect(error().hidden).toBe(false)
      await m.update({ invalid: false })
      expect(error().hidden).toBe(true)
    })
  })
}
