import { describe, expect, it, vi } from 'vitest'
import { type Adapter, type TextareaProps, freshTarget, part, typeInto } from './harness'

/** Textarea on its own: Input's contract, plus rows, resize and auto-resize. */
export function textareaConformance(adapter: Adapter) {
  describe('textarea', () => {
    const setup = async (props: TextareaProps = {}) => {
      const m = await adapter.textarea(props, freshTarget())
      return { m, textarea: () => part(m.root, 'textarea', 'root') as HTMLTextAreaElement }
    }

    it('renders a native textarea as the root, with its attributes', async () => {
      const { textarea } = await setup({ size: 'lg', name: 'bio', placeholder: 'About you', rows: 4, maxLength: 280 })
      expect(textarea().tagName).toBe('TEXTAREA')
      expect(textarea().dataset.size).toBe('lg')
      expect(textarea().name).toBe('bio')
      expect(textarea().placeholder).toBe('About you')
      expect(textarea().rows).toBe(4)
      expect(textarea().maxLength).toBe(280)
    })

    it('defaults to medium with a vertical resize handle, and no class names', async () => {
      const { m, textarea } = await setup()
      expect(textarea().dataset.size).toBe('md')
      expect(textarea().dataset.resize).toBe('vertical')
      expect(textarea().hasAttribute('data-autoresize')).toBe(false)
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('reports the value as the user types, and starts from defaultValue', async () => {
      const onValueChange = vi.fn()
      const { textarea } = await setup({ onValueChange, defaultValue: 'draft' })
      expect(textarea().value).toBe('draft')
      await adapter.act(() => typeInto(textarea(), 'line one\nline two'))
      expect(onValueChange).toHaveBeenLastCalledWith('line one\nline two')
    })

    it('keeps readonly distinct from disabled, and reflects required', async () => {
      const readonly = (await setup({ readOnly: true, required: true })).textarea()
      expect(readonly.readOnly).toBe(true)
      expect(readonly.disabled).toBe(false)
      expect(readonly.required).toBe(true)
      expect((await setup({ disabled: true })).textarea().disabled).toBe(true)
    })

    it('marks invalid, and clears it', async () => {
      const { m, textarea } = await setup({ invalid: true })
      expect(textarea().getAttribute('aria-invalid')).toBe('true')
      expect(textarea().hasAttribute('data-invalid')).toBe(true)
      await m.update({ invalid: false })
      expect(textarea().hasAttribute('aria-invalid')).toBe(false)
    })

    it('can turn the resize handle off', async () => {
      expect((await setup({ resize: 'none' })).textarea().dataset.resize).toBe('none')
    })

    describe('auto-resize', () => {
      it('takes over the height and the resize handle', async () => {
        const { textarea } = await setup({ autoResize: true, maxRows: 6 })
        expect(textarea().hasAttribute('data-autoresize')).toBe(true)
        expect(textarea().dataset.resize).toBe('none')
        // Measured: autosize writes an inline height and hides overflow while it fits.
        expect(textarea().style.height).not.toBe('')
        expect(textarea().style.overflowY).toBe('hidden')
      })

      it('lets go when switched off, and takes over again when switched on', async () => {
        const { m, textarea } = await setup({ autoResize: true })
        await m.update({ autoResize: false })
        expect(textarea().style.height).toBe('')
        expect(textarea().dataset.resize).toBe('vertical')

        await m.update({ autoResize: true })
        expect(textarea().style.height).not.toBe('')
      })

      it('lets go when unmounted', async () => {
        const { m, textarea } = await setup({ autoResize: true })
        const element = textarea()
        await m.unmount()
        // The listener is gone: typing into the detached element measures nothing.
        element.style.removeProperty('height')
        typeInto(element, 'more')
        expect(element.style.height).toBe('')
      })
    })

    const controlled = adapter.supports.controlled ? it : it.skip
    controlled('follows a controlled value pushed by the owner', async () => {
      const { m, textarea } = await setup({ value: 'one', onValueChange: vi.fn() })
      expect(textarea().value).toBe('one')
      await m.update({ value: 'two' })
      expect(textarea().value).toBe('two')
    })
  })
}
