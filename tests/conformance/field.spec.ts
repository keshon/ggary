import { describe, expect, it } from 'vitest'
import { type Adapter, type FieldProps, freshTarget, part, typeInto } from './harness'

/**
 * Field around an Input: label and description wiring, and validation on the
 * :user-invalid rule — no native error until the user leaves the control or a
 * submit asks, then live clearing as the value is fixed.
 */
export function fieldConformance(adapter: Adapter) {
  describe('field', () => {
    const setup = async (props: FieldProps = {}) => {
      const m = await adapter.field({ label: 'Email', ...props }, freshTarget('form'))
      const control = () => part(m.root, 'input', 'root') as HTMLInputElement
      return {
        m,
        control,
        label: () => part(m.root, 'field', 'label') as HTMLLabelElement,
        hint: () => part(m.root, 'field', 'hint'),
        error: () => part(m.root, 'field', 'error')!,
        blur: () =>
          adapter.act(() => {
            control().focus()
            control().blur()
          }),
        type: (text: string) => adapter.act(() => typeInto(control(), text)),
        described: () => control().getAttribute('aria-describedby'),
      }
    }

    describe('anatomy and wiring', () => {
      it('renders the field parts around a control that keeps its own scope', async () => {
        const { m, control, label, hint, error } = await setup({ hint: 'Work address' })
        expect(part(m.root, 'field', 'root') ?? m.root.closest('[data-scope="field"]')).toBeTruthy()
        expect(label()).toBeTruthy()
        expect(hint()).toBeTruthy()
        expect(error()).toBeTruthy()
        expect(control().dataset.scope).toBe('input')
      })

      it('labels the control', async () => {
        const { control, label } = await setup()
        expect(control().id).not.toBe('')
        expect(label().htmlFor).toBe(control().id)
        expect(label().textContent).toContain('Email')
      })

      it('describes the control by its hint while valid, with the error slot hidden', async () => {
        const { described, hint, error } = await setup({ hint: 'Work address', error: 'Enter an address' })
        expect(described()).toBe(hint()!.id)
        expect(hint()!.hidden).toBe(false)
        expect(error().hidden).toBe(true)
      })

      it('marks required on the control, and on the label for the theme to draw', async () => {
        const { control, label } = await setup({ required: true })
        expect(control().required).toBe(true)
        expect(label().hasAttribute('data-required')).toBe(true)
      })

      it('passes disabled and readonly down to the control', async () => {
        expect((await setup({ disabled: true })).control().disabled).toBe(true)
        expect((await setup({ readOnly: true })).control().readOnly).toBe(true)
      })

      it('follows those flags when the owner changes them', async () => {
        const { m, control, label } = await setup({ disabled: true, required: true })
        await m.update({ disabled: false, required: false })
        expect(control().disabled).toBe(false)
        expect(control().required).toBe(false)
        expect(label().hasAttribute('data-required')).toBe(false)
      })
    })

    describe('validation timing', () => {
      const required = { required: true, hint: 'Work address', error: 'Enter your email' }

      it('shows no error before the user leaves the control, however invalid', async () => {
        const { control, error, type } = await setup({ ...required, input: { type: 'email' } })
        await type('me@')
        expect(control().validity.valid).toBe(false)
        expect(control().hasAttribute('aria-invalid')).toBe(false)
        expect(error().hidden).toBe(true)
      })

      it('on leaving an invalid control, the error replaces the hint', async () => {
        const { control, error, hint, described, blur } = await setup(required)
        await blur()
        expect(control().getAttribute('aria-invalid')).toBe('true')
        expect(error().hidden).toBe(false)
        expect(error().textContent).toBe('Enter your email')
        expect(hint()!.hidden).toBe(true)
        expect(described()).toBe(error().id)
      })

      it('clears live once the value is fixed', async () => {
        const { control, error, hint, blur, type } = await setup(required)
        await blur()
        await type('me@example.com')
        expect(control().hasAttribute('aria-invalid')).toBe(false)
        expect(error().hidden).toBe(true)
        expect(hint()!.hidden).toBe(false)
      })

      it('uses the native constraint, not only required: a malformed email is invalid on leaving', async () => {
        const { control, blur, type } = await setup({ input: { type: 'email' }, error: 'Not an email' })
        await type('nope')
        expect(control().hasAttribute('aria-invalid')).toBe(false)
        await blur()
        expect(control().getAttribute('aria-invalid')).toBe('true')
      })

      it('shows on a submit attempt, even for a control never focused', async () => {
        const { control, error } = await setup(required)
        await adapter.act(() => {
          control().checkValidity()
        })
        expect(control().getAttribute('aria-invalid')).toBe('true')
        expect(error().hidden).toBe(false)
      })
    })

    describe('validation continuity', () => {
      it('keeps a malformed value invalid after a required error has already shown', async () => {
        const { control, error, blur, type } = await setup({ required: true, input: { type: 'email' } })
        await blur()
        await type('still-not-an-email')
        expect(control().getAttribute('aria-invalid')).toBe('true')
        expect(error().hidden).toBe(false)
        await type('person@example.com')
        expect(control().hasAttribute('aria-invalid')).toBe(false)
      })

      if (adapter.name === 'react') it('a refused controlled edit leaves the field valid and reports the request once', async () => {
        let requests = 0
        const { control, blur, type } = await setup({ input: { type: 'email', value: 'person@example.com', onValueChange: () => { requests++ } } })
        await blur()
        await type('invalid')
        expect(control().value).toBe('person@example.com')
        expect(control().hasAttribute('aria-invalid')).toBe(false)
        expect(requests).toBe(1)
      })

      it('reset keeps the control node and lets it validate again on the next blur', async () => {
        const { m, control, error, blur } = await setup({ required: true, error: 'Required' })
        const original = control()
        await blur()
        await adapter.act(() => (m.root.closest('form') as HTMLFormElement).reset())
        await adapter.wait(20)
        expect(control()).toBe(original)
        expect(original.hasAttribute('aria-invalid')).toBe(false)
        expect(error().hidden).toBe(true)
        await blur()
        expect(original.getAttribute('aria-invalid')).toBe('true')
        expect(error().hidden).toBe(false)
      })

      if (adapter.name === 'react') it('a Base UI NumberField reports native bounds and resets without stale ARIA', async () => {
        const m = await adapter.field({ label: 'Radius', error: 'Too large', numberField: { defaultValue: 45, max: 40 } }, freshTarget('form'))
        const input = part(m.root, 'number-field', 'input') as HTMLInputElement
        await adapter.act(() => { input.focus(); input.blur() })
        expect(input.getAttribute('aria-invalid')).toBe('true')
        expect(part(m.root, 'field', 'error')!.textContent).toBe('Too large')
        await adapter.act(() => (m.root.closest('form') as HTMLFormElement).reset())
        await adapter.wait(20)
        expect(input.hasAttribute('aria-invalid')).toBe(false)
        expect(part(m.root, 'field', 'error')!.hidden).toBe(true)
      })

      if (adapter.name === 'react') it('a Base UI choice validates on visible blur and clears its ARIA on reset', async () => {
        const m = await adapter.field({ label: 'Terms', required: true, error: 'Accept the terms', checkbox: { label: 'I agree' } }, freshTarget('form'))
        const toggle = part(m.root, 'checkbox', 'toggle')!
        const input = part(m.root, 'checkbox', 'input') as HTMLInputElement
        await adapter.act(() => input.focus())
        expect(document.activeElement).toBe(toggle)
        expect(toggle.hasAttribute('aria-invalid')).toBe(false)
        expect(part(m.root, 'field', 'error')!.hidden).toBe(true)
        await adapter.act(() => toggle.blur())
        expect(toggle.getAttribute('aria-invalid')).toBe('true')
        expect(input.getAttribute('aria-invalid')).toBe('true')
        await adapter.act(() => (m.root.closest('form') as HTMLFormElement).reset())
        await adapter.wait(20)
        expect(part(m.root, 'checkbox', 'toggle')).toBe(toggle)
        expect(toggle.hasAttribute('aria-invalid')).toBe(false)
        expect(input.hasAttribute('aria-invalid')).toBe(false)
        expect(part(m.root, 'field', 'error')!.hidden).toBe(true)
      })

      it('search participates in the same native validation boundary', async () => {
        const m = await adapter.field({ label: 'Search', required: true, error: 'Enter a query', search: {} }, freshTarget('form'))
        const input = part(m.root, 'input', 'root') as HTMLInputElement
        await adapter.act(() => { input.focus(); input.blur() })
        expect(input.getAttribute('aria-invalid')).toBe('true')
        expect(part(m.root, 'field', 'error')!.textContent).toBe('Enter a query')
        await adapter.act(() => typeInto(input, 'query'))
        expect(input.hasAttribute('aria-invalid')).toBe(false)
      })
    })

    describe('around a textarea', () => {
      const withTextarea = (props: FieldProps = {}) =>
        adapter.field({ label: 'Message', ...props, textarea: { rows: 3, ...props.textarea } }, freshTarget('form'))
      const textareaIn = (root: Element) => part(root, 'textarea', 'root') as HTMLTextAreaElement

      it('labels and describes a textarea that keeps its own contract', async () => {
        const m = await withTextarea({ hint: 'Markdown works', textarea: { size: 'sm' } })
        const textarea = textareaIn(m.root)
        expect(textarea.tagName).toBe('TEXTAREA')
        expect((part(m.root, 'field', 'label') as HTMLLabelElement).htmlFor).toBe(textarea.id)
        expect(textarea.getAttribute('aria-describedby')).toBe(part(m.root, 'field', 'hint')!.id)
        expect(textarea.dataset.size).toBe('sm')
        expect(textarea.rows).toBe(3)
      })

      it('validates it on the same timing', async () => {
        const m = await withTextarea({ required: true, error: 'Say something' })
        const textarea = textareaIn(m.root)
        await adapter.act(() => typeInto(textarea, ''))
        expect(textarea.hasAttribute('aria-invalid')).toBe(false)
        await adapter.act(() => {
          textarea.focus()
          textarea.blur()
        })
        expect(textarea.getAttribute('aria-invalid')).toBe('true')
        expect(part(m.root, 'field', 'error')!.textContent).toBe('Say something')
        await adapter.act(() => typeInto(textarea, 'hello'))
        expect(textarea.hasAttribute('aria-invalid')).toBe(false)
      })

      it('auto-resizes inside a field', async () => {
        const m = await withTextarea({ textarea: { autoResize: true, maxRows: 5 } })
        const textarea = textareaIn(m.root)
        expect(textarea.dataset.resize).toBe('none')
        expect(textarea.style.overflowY).toBe('hidden')
      })
    })

    describe('around a checkbox or a switch', () => {
      it('labels and describes the box, which keeps its own label', async () => {
        const m = await adapter.field({ label: 'Terms', hint: 'Required to continue', checkbox: { label: 'I agree' } }, freshTarget('form'))
        const input = part(m.root, 'checkbox', 'input') as HTMLInputElement
        expect((part(m.root, 'field', 'label') as HTMLLabelElement).htmlFor).toBe(input.id)
        expect(input.getAttribute('aria-describedby')).toBe(part(m.root, 'field', 'hint')!.id)
        expect(part(m.root, 'checkbox', 'label')!.textContent?.trim()).toBe('I agree')
        // Not the text-input contract: the box is not an Input.
        expect(input.hasAttribute('data-size')).toBe(false)
      })

      it('validates a required box on the same timing, and clears when it is checked', async () => {
        const m = await adapter.field({ required: true, error: 'Accept the terms', checkbox: { label: 'I agree' } }, freshTarget('form'))
        const input = part(m.root, 'checkbox', 'input') as HTMLInputElement
        expect(input.required).toBe(true)
        await adapter.act(() => {
          const focusable = adapter.name === 'react' ? part(m.root, 'checkbox', 'toggle')! : input
          focusable.focus()
          focusable.blur()
        })
        expect(input.getAttribute('aria-invalid')).toBe('true')
        expect(part(m.root, 'checkbox', 'root')!.hasAttribute('data-invalid')).toBe(true)
        expect(part(m.root, 'field', 'error')!.textContent).toBe('Accept the terms')

        await adapter.act(() => input.click())
        expect(input.hasAttribute('aria-invalid')).toBe(false)
        expect(part(m.root, 'field', 'error')!.hidden).toBe(true)
      })

      it('passes disabled and readonly to a switch, as a switch understands them', async () => {
        const m = await adapter.field({ label: 'Sync', disabled: true, switch: { label: 'On' } }, freshTarget())
        const input = part(m.root, 'switch', 'input') as HTMLInputElement
        expect(input.disabled).toBe(true)
        expect(part(m.root, 'switch', 'root')!.hasAttribute('data-disabled')).toBe(true)
        await m.update({ disabled: false, readOnly: true })
        expect(input.disabled).toBe(false)
        expect(input.getAttribute('aria-readonly')).toBe('true')
        expect(input.hasAttribute('readonly')).toBe(false)
      })
    })

    describe('owner-declared invalid', () => {
      it('shows at once, untouched, and clears when the owner says so', async () => {
        const { m, control, error } = await setup({ invalid: true, error: 'That name is taken' })
        expect(control().getAttribute('aria-invalid')).toBe('true')
        expect(error().textContent).toBe('That name is taken')

        await m.update({ invalid: false })
        expect(control().hasAttribute('aria-invalid')).toBe(false)
        expect(error().hidden).toBe(true)
      })

      it('invalid with no message keeps the hint, and still tells assistive tech', async () => {
        const { control, hint, described } = await setup({ invalid: true, hint: 'Work address' })
        expect(control().getAttribute('aria-invalid')).toBe('true')
        expect(hint()!.hidden).toBe(false)
        expect(described()).toBe(hint()!.id)
      })
    })
  })
}
