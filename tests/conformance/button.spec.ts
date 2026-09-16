import { describe, expect, it } from 'vitest'
import { type Adapter, freshTarget, part } from './harness'

/** The Button contract every theme's button.css is written against. */
export function buttonConformance(adapter: Adapter) {
  describe('button', () => {
    const setup = async (props: Parameters<Adapter['button']>[0] = { label: 'Go' }) => {
      const m = await adapter.button(props, freshTarget())
      return { m, button: () => part(m.root, 'button', 'root') as HTMLButtonElement }
    }

    describe('intent attributes', () => {
      it('defaults to medium emphasis and emits no tone for neutral', async () => {
        const { button } = await setup()
        expect(button().dataset.emphasis).toBe('medium')
        expect(button().hasAttribute('data-tone')).toBe(false)
      })

      it('emits emphasis and tone as data attributes', async () => {
        const { button } = await setup({ label: 'Go', emphasis: 'high', tone: 'danger' })
        expect(button().dataset.emphasis).toBe('high')
        expect(button().dataset.tone).toBe('danger')
      })

      // Named by intent so a theme that forbids a LOOK can still honour every
      // value. A look-named attribute would be a lie in some theme.
      it('never emits a look-named variant', async () => {
        const { button } = await setup({ label: 'Go', emphasis: 'low' })
        expect(button().hasAttribute('data-variant')).toBe(false)
      })

      it('follows a prop change', async () => {
        const { m, button } = await setup({ label: 'Go', emphasis: 'low' })
        await m.update({ emphasis: 'minimal' })
        expect(button().dataset.emphasis).toBe('minimal')
      })

      it('renders the label', async () => {
        const { button } = await setup({ label: 'Save changes' })
        expect(button().textContent).toContain('Save changes')
      })
    })

    // Disabling a busy button drops it out of the tab order under the fingers of
    // whoever pressed it from the keyboard. The first scaffold did exactly that.
    describe('busy is not disabled', () => {
      it('keeps a loading button enabled and focusable', async () => {
        const { button } = await setup({ label: 'Go', loading: true })
        expect(button().disabled).toBe(false)
        expect(button().hasAttribute('data-disabled')).toBe(false)
        button().focus()
        expect(document.activeElement).toBe(button())
      })

      it('announces busy through aria-busy and data-loading', async () => {
        const { button } = await setup({ label: 'Go', loading: true })
        expect(button().getAttribute('aria-busy')).toBe('true')
        expect(button().hasAttribute('data-loading')).toBe(true)
      })

      it('renders the spinner part, so a theme can choose whether to draw it', async () => {
        const { button } = await setup({ label: 'Go', loading: true })
        expect(part(button(), 'button', 'spinner')).toBeTruthy()
      })

      it('disables only when asked to', async () => {
        const { button } = await setup({ label: 'Go', disabled: true })
        expect(button().disabled).toBe(true)
        expect(button().hasAttribute('data-disabled')).toBe(true)
      })
    })
  })
}
