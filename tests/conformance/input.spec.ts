import { describe, expect, it, vi } from 'vitest'
import { type Adapter, type InputProps, click, freshTarget, part, typeInto } from './harness'

/** Input on its own: the attribute contract and the value callback. */
export function inputConformance(adapter: Adapter) {
  describe('input', () => {
    const setup = async (props: InputProps = {}, target = freshTarget()) => {
      const m = await adapter.input(props, target)
      return { m, input: () => part(m.root, 'input', 'root') as HTMLInputElement, reveal: () => part(m.root, 'input', 'reveal') as HTMLButtonElement | null }
    }

    it('a password field has a button that shows what was typed: one name, pressed or not', async () => {
      const { m, input, reveal } = await setup({ type: 'password', defaultValue: 'hunter2' })
      expect(part(m.root, 'input', 'field')!.contains(input())).toBe(true)
      expect(input().type).toBe('password')
      expect(reveal()!.type).toBe('button')
      expect(reveal()!.getAttribute('aria-label')).toBe('Show password')
      expect(reveal()!.getAttribute('aria-pressed')).toBe('false')
      await adapter.act(() => click(reveal()!))
      expect(input().type).toBe('text')
      expect(input().value).toBe('hunter2')
      expect(reveal()!.getAttribute('aria-pressed')).toBe('true')
      expect(part(m.root, 'input', 'reveal-icon')!.dataset.icon).toBe('eye-off')
      await adapter.act(() => click(reveal()!))
      expect(input().type).toBe('password')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('a shown password is hidden again when its form is sent', async () => {
      const form = freshTarget('form') as HTMLFormElement
      form.addEventListener('submit', (event) => event.preventDefault())
      const { input, reveal } = await setup({ type: 'password', name: 'password' }, form)
      await adapter.act(() => click(reveal()!))
      expect(input().type).toBe('text')
      await adapter.act(() => void form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
      expect(input().type).toBe('password')
      expect(reveal()!.getAttribute('aria-pressed')).toBe('false')
    })

    it('reveal={false} leaves a password field as the browser draws it; other types never have one', async () => {
      const off = await setup({ type: 'password', reveal: false })
      expect(off.reveal()).toBeNull()
      expect(part(off.m.root, 'input', 'field')).toBeNull()
      expect(off.input().hasAttribute('data-reveal')).toBe(false)
      const text = await setup({ type: 'email' })
      expect(text.reveal()).toBeNull()
    })

    it('the button takes its words, and a disabled field disables it', async () => {
      const { reveal } = await setup({ type: 'password', disabled: true, words: { reveal: 'Показать пароль' } })
      expect(reveal()!.getAttribute('aria-label')).toBe('Показать пароль')
      expect(reveal()!.disabled).toBe(true)
    })

    it('renders a native input as the input root, with type and size', async () => {
      const { input } = await setup({ type: 'email', size: 'sm', name: 'email', placeholder: 'you@example.com' })
      expect(input().tagName).toBe('INPUT')
      expect(input().type).toBe('email')
      expect(input().dataset.size).toBe('sm')
      expect(input().name).toBe('email')
      expect(input().placeholder).toBe('you@example.com')
    })

    it('defaults to a medium text input, with no class names', async () => {
      const { m, input } = await setup()
      expect(input().type).toBe('text')
      expect(input().dataset.size).toBe('md')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('reports the value as the user types', async () => {
      const onValueChange = vi.fn()
      const { input } = await setup({ onValueChange })
      await adapter.act(() => typeInto(input(), 'hello'))
      expect(onValueChange).toHaveBeenLastCalledWith('hello')
    })

    it('starts from defaultValue', async () => {
      const { input } = await setup({ defaultValue: 'draft' })
      expect(input().value).toBe('draft')
    })

    it('keeps readonly distinct from disabled', async () => {
      const readonly = (await setup({ readOnly: true })).input()
      expect(readonly.readOnly).toBe(true)
      expect(readonly.disabled).toBe(false)

      const disabled = (await setup({ disabled: true })).input()
      expect(disabled.disabled).toBe(true)
      expect(disabled.readOnly).toBe(false)
    })

    it('marks invalid for assistive tech and for the theme', async () => {
      const { m, input } = await setup({ invalid: true })
      expect(input().getAttribute('aria-invalid')).toBe('true')
      expect(input().hasAttribute('data-invalid')).toBe(true)
      await m.update({ invalid: false })
      expect(input().hasAttribute('aria-invalid')).toBe(false)
    })

    it('reflects required', async () => {
      expect((await setup({ required: true })).input().required).toBe(true)
    })

    const controlled = adapter.supports.controlled ? it : it.skip
    controlled('follows a controlled value pushed by the owner', async () => {
      const { m, input } = await setup({ value: 'one', onValueChange: vi.fn() })
      expect(input().value).toBe('one')
      await m.update({ value: 'two' })
      expect(input().value).toBe('two')
    })
  })
}
