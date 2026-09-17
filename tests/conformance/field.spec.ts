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
