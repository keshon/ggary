import { describe, expect, it, vi } from 'vitest'
import { type Adapter, type CheckboxProps, click, freshTarget, part } from './harness'

/**
 * Checkbox, and — through `choiceConformance` — Switch, which has the same
 * contract with a thumb for a mark and no indeterminate state.
 */
export function checkboxConformance(adapter: Adapter) {
  choiceConformance(adapter, 'checkbox')

  describe('checkbox — indeterminate', () => {
    const setup = async (props: CheckboxProps) => {
      const m = await adapter.checkbox({ label: 'All', ...props }, freshTarget())
      return {
        m,
        input: () => part(m.root, 'checkbox', 'input') as HTMLInputElement,
        indicator: () => part(m.root, 'checkbox', 'indicator') as HTMLElement,
      }
    }

    it('shows a dash for indeterminate, and sets the property the browser reads', async () => {
      const { input, indicator } = await setup({ defaultChecked: 'indeterminate' })
      expect(input().indeterminate).toBe(true)
      expect(input().checked).toBe(false)
      expect(indicator().dataset.icon).toBe('minus')
      expect(indicator().dataset.state).toBe('indeterminate')
    })

    it('a click resolves indeterminate to checked, and reports a boolean', async () => {
      const onCheckedChange = vi.fn()
      const { input, indicator } = await setup({ defaultChecked: 'indeterminate', onCheckedChange })
      await adapter.act(() => click(input()))
      expect(onCheckedChange).toHaveBeenLastCalledWith(true)
      expect(input().indeterminate).toBe(false)
      expect(input().checked).toBe(true)
      expect(indicator().dataset.icon).toBe('check')
    })

    const controlled = adapter.supports.controlled ? it : it.skip
    controlled('follows checked, unchecked and indeterminate pushed by the owner', async () => {
      const { m, input, indicator } = await setup({ checked: true, onCheckedChange: vi.fn() })
      expect(input().checked).toBe(true)
      await m.update({ checked: 'indeterminate' })
      expect(input().indeterminate).toBe(true)
      expect(indicator().dataset.icon).toBe('minus')
      await m.update({ checked: false })
      expect(input().indeterminate).toBe(false)
      expect(input().checked).toBe(false)
    })
  })
}

export function switchConformance(adapter: Adapter) {
  choiceConformance(adapter, 'switch')

  describe('switch — role', () => {
    it('is a checkbox input announced as a switch, with a decorative thumb', async () => {
      const m = await adapter.switch({ label: 'Wi-Fi' }, freshTarget())
      const input = part(m.root, 'switch', 'input') as HTMLInputElement
      expect(input.type).toBe('checkbox')
      expect(input.getAttribute('role')).toBe('switch')
      expect(part(m.root, 'switch', 'thumb')!.getAttribute('aria-hidden')).toBe('true')
    })
  })
}

function choiceConformance(adapter: Adapter, scope: 'checkbox' | 'switch') {
  describe(scope, () => {
    const mount = (props: CheckboxProps, target: HTMLElement) =>
      scope === 'checkbox' ? adapter.checkbox(props, target) : adapter.switch(props as never, target)

    const setup = async (props: CheckboxProps = {}, target = freshTarget()) => {
      const m = await mount({ label: 'Email me', ...props }, target)
      return {
        m,
        root: () => part(m.root, scope, 'root') as HTMLLabelElement,
        input: () => part(m.root, scope, 'input') as HTMLInputElement,
        text: () => part(m.root, scope, 'label') as HTMLElement,
      }
    }

    it('is a label around a control that stacks the native input and its drawing, then the text', async () => {
      const { m, root, input, text } = await setup()
      const control = part(m.root, scope, 'control')!
      const drawn = part(m.root, scope, scope === 'checkbox' ? 'indicator' : 'thumb')!
      expect(root().tagName).toBe('LABEL')
      expect(input().type).toBe('checkbox')
      expect(control.contains(input())).toBe(true)
      expect(control.contains(drawn)).toBe(true)
      expect(root().contains(text())).toBe(true)
      expect(text().textContent?.trim()).toBe('Email me')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('toggles from a click on its text, and reports each change', async () => {
      const onCheckedChange = vi.fn()
      const { root, input, text } = await setup({ onCheckedChange })
      expect(root().dataset.state).toBe('unchecked')

      await adapter.act(() => click(text()))
      expect(input().checked).toBe(true)
      expect(onCheckedChange).toHaveBeenLastCalledWith(true)
      expect(root().dataset.state).toBe('checked')

      await adapter.act(() => click(input()))
      expect(input().checked).toBe(false)
      expect(onCheckedChange).toHaveBeenLastCalledWith(false)
      expect(root().dataset.state).toBe('unchecked')
    })

    it('starts from defaultChecked', async () => {
      const { root, input } = await setup({ defaultChecked: true })
      expect(input().checked).toBe(true)
      expect(root().dataset.state).toBe('checked')
    })

    it('submits its name and value when checked, and nothing when not', async () => {
      const form = freshTarget('form') as HTMLFormElement
      const { input } = await setup({ name: 'updates', value: 'weekly' }, form)
      expect(new FormData(form).has('updates')).toBe(false)
      await adapter.act(() => click(input()))
      expect(new FormData(form).get('updates')).toBe('weekly')
    })

    it('disabled: not toggled, and marked on every part', async () => {
      const onCheckedChange = vi.fn()
      const { root, input } = await setup({ disabled: true, onCheckedChange })
      await adapter.act(() => click(input()))
      expect(input().checked).toBe(false)
      expect(onCheckedChange).not.toHaveBeenCalled()
      expect(input().disabled).toBe(true)
      expect(root().hasAttribute('data-disabled')).toBe(true)
    })

    it('readonly: focusable and announced, but a click changes nothing', async () => {
      const onCheckedChange = vi.fn()
      const { root, input, text } = await setup({ readOnly: true, defaultChecked: true, onCheckedChange })
      await adapter.act(() => click(input()))
      await adapter.act(() => click(text()))
      expect(input().checked).toBe(true)
      expect(onCheckedChange).not.toHaveBeenCalled()
      expect(input().disabled).toBe(false)
      expect(input().getAttribute('aria-readonly')).toBe('true')
      expect(root().hasAttribute('data-readonly')).toBe(true)
    })

    it('required and invalid reach the input and the state attributes', async () => {
      const { m, root, input } = await setup({ required: true, invalid: true })
      expect(input().required).toBe(true)
      expect(input().getAttribute('aria-invalid')).toBe('true')
      expect(root().hasAttribute('data-invalid')).toBe(true)
      await m.update({ invalid: false })
      expect(input().hasAttribute('aria-invalid')).toBe(false)
      expect(root().hasAttribute('data-invalid')).toBe(false)
    })

    const controlled = adapter.supports.controlled ? it : it.skip
    controlled('follows a checked state pushed by the owner', async () => {
      const { m, root, input } = await setup({ checked: false, onCheckedChange: vi.fn() })
      await m.update({ checked: true })
      expect(input().checked).toBe(true)
      expect(root().dataset.state).toBe('checked')
      await m.update({ checked: false })
      expect(input().checked).toBe(false)
    })
  })
}
