import { describe, expect, it, vi } from 'vitest'
import { openLayerCount } from '../../packages/core/src/utils/dismissable'
import { type Adapter, type DialogProps, click, freshTarget, part } from './harness'

/**
 * Dialog: the trigger's announcements, the naming, and every way in and out.
 *
 * Under jsdom the <dialog> methods are shims, so this proves the wiring; the
 * browser run of the same spec proves it against a real top layer. What only
 * a browser has — :modal, the inert page, a native form close — is in
 * tests/dialog.browser.test.ts.
 */
export function dialogConformance(adapter: Adapter) {
  describe('dialog', () => {
    const setup = async (props: DialogProps = {}) => {
      const m = await adapter.dialog({ trigger: 'Open', title: 'Rename', description: 'Pick a new name', ...props }, freshTarget())
      const content = () => part(m.root, 'dialog', 'content') as HTMLDialogElement
      return {
        m,
        content,
        // Found by its ARIA: the trigger carries no dialog part, it is the page's button.
        trigger: () => m.root.querySelector('[aria-haspopup="dialog"]') as HTMLButtonElement,
        open: () => adapter.act(() => click(m.root.querySelector('[aria-haspopup="dialog"]')!)),
        escape: () =>
          adapter.act(() => {
            const target = document.activeElement ?? document.body
            target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
          }),
        // A press on the backdrop is targeted at the dialog element, outside its box.
        pressBackdrop: () =>
          adapter.act(() => {
            content().dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 1, clientY: 1 }))
          }),
        action: () => [...content().querySelectorAll('button')].find((b) => b.textContent === 'Body action')!,
      }
    }

    it('rests closed, with a trigger that says what it opens', async () => {
      const { m, content, trigger } = await setup()
      expect(content().tagName).toBe('DIALOG')
      expect(content().open).toBe(false)
      expect(content().dataset.state).toBe('closed')
      expect(trigger().getAttribute('aria-haspopup')).toBe('dialog')
      expect(trigger().getAttribute('aria-expanded')).toBe('false')
      expect(trigger().getAttribute('aria-controls')).toBe(content().id)
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('opens from its trigger, named by its title and description, with focus inside', async () => {
      const onOpenChange = vi.fn()
      const { m, content, trigger, open } = await setup({ onOpenChange })
      await open()
      expect(content().open).toBe(true)
      expect(content().dataset.state).toBe('open')
      expect(trigger().getAttribute('aria-expanded')).toBe('true')
      expect(onOpenChange).toHaveBeenLastCalledWith(true, { reason: 'trigger' })
      expect(document.getElementById(content().getAttribute('aria-labelledby')!)!.textContent).toBe('Rename')
      expect(document.getElementById(content().getAttribute('aria-describedby')!)!.textContent).toBe('Pick a new name')
      expect(content().contains(document.activeElement)).toBe(true)
      expect(part(m.root, 'dialog', 'close')!.getAttribute('aria-label')).toBe('Close')
    })

    it('Escape closes it, once, and focus goes back to the trigger', async () => {
      const onOpenChange = vi.fn()
      const { content, trigger, open, escape } = await setup({ onOpenChange })
      await open()
      await escape()
      expect(content().open).toBe(false)
      expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: 'escape' })
      expect(onOpenChange).toHaveBeenCalledTimes(2)
      expect(document.activeElement).toBe(trigger())
      expect(openLayerCount()).toBe(0)
    })

    it('a press on the backdrop closes it; a press inside does not', async () => {
      const onOpenChange = vi.fn()
      const { content, open, pressBackdrop, action } = await setup({ onOpenChange })
      await open()
      await adapter.act(() => action().dispatchEvent(new MouseEvent('pointerdown', { bubbles: true })))
      expect(content().open).toBe(true)
      await pressBackdrop()
      expect(content().open).toBe(false)
      expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: 'outside' })
    })

    it('the close button closes it', async () => {
      const onOpenChange = vi.fn()
      const { m, content, open } = await setup({ onOpenChange })
      await open()
      await adapter.act(() => click(part(m.root, 'dialog', 'close')!))
      expect(content().open).toBe(false)
      expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: 'close-button' })
    })

    it('persistent: neither Escape nor the backdrop closes it, and Escape goes no further', async () => {
      const { m, content, open, escape, pressBackdrop } = await setup({ closeOnEscape: false, closeOnOutside: false })
      await open()
      await escape()
      await pressBackdrop()
      expect(content().open).toBe(true)
      await adapter.act(() => click(part(m.root, 'dialog', 'close')!))
      expect(content().open).toBe(false)
    })

    it('renders the footer, and an alert dialog says so', async () => {
      const { m, content } = await setup({ role: 'alertdialog', footer: 'Confirm', defaultOpen: true })
      expect(content().open).toBe(true)
      expect(content().getAttribute('role')).toBe('alertdialog')
      expect(part(m.root, 'dialog', 'footer')!.textContent).toContain('Confirm')
    })

    it('a non-modal dialog is marked so, and closes on a press anywhere outside it', async () => {
      const { content, open } = await setup({ modal: false })
      await open()
      expect(content().open).toBe(true)
      expect(content().hasAttribute('data-modal')).toBe(false)
      await adapter.act(() => document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true })))
      expect(content().open).toBe(false)
    })

    it('without a title it is not labelled by a missing element', async () => {
      const { content } = await setup({ title: undefined, description: undefined, defaultOpen: true })
      expect(content().hasAttribute('aria-labelledby')).toBe(false)
      expect(content().hasAttribute('aria-describedby')).toBe(false)
    })

    it('follows open pushed by the owner, without reporting it back', async () => {
      const onOpenChange = vi.fn()
      const { m, content } = await setup({ open: false, onOpenChange })
      await m.update({ open: true })
      expect(content().open).toBe(true)
      await m.update({ open: false })
      expect(content().open).toBe(false)
      expect(onOpenChange).not.toHaveBeenCalled()
    })

    it('a kit Button as the trigger stays a Button, and still opens it', async () => {
      const { content, trigger, open, escape } = await setup({ triggerIsButton: true })
      expect(trigger().dataset.scope).toBe('button')
      await open()
      expect(content().open).toBe(true)
      expect(trigger().getAttribute('aria-expanded')).toBe('true')
      await escape()
      expect(trigger().dataset.scope).toBe('button')
      expect(trigger().getAttribute('aria-expanded')).toBe('false')
      expect(document.activeElement).toBe(trigger())
    })

    describe('sheet', () => {
      it('a dialog stands in the centre unless placed', async () => {
        const { content } = await setup()
        expect(content().dataset.placement).toBe('center')
      })

      it('Sheet is the same modal dialog at the end edge by default, and at the start edge on request', async () => {
        const onOpenChange = vi.fn()
        const end = await setup({ sheet: true, onOpenChange })
        expect(end.content().tagName).toBe('DIALOG')
        expect(end.content().dataset.placement).toBe('end')
        await end.open()
        expect(end.content().open).toBe(true)
        expect(end.content().hasAttribute('data-modal')).toBe(true)
        expect(document.getElementById(end.content().getAttribute('aria-labelledby')!)!.textContent).toBe('Rename')
        expect(end.content().contains(document.activeElement)).toBe(true)
        await end.escape()
        expect(end.content().open).toBe(false)
        expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: 'escape' })
        expect(document.activeElement).toBe(end.trigger())

        const start = await setup({ sheet: 'start', trigger: 'Sections' })
        expect(start.content().dataset.placement).toBe('start')
      })
    })

    it('unmounted while open, it leaves nothing listening', async () => {
      const { m, open } = await setup()
      await open()
      expect(openLayerCount()).toBe(1)
      await m.unmount()
      expect(openLayerCount()).toBe(0)
    })
  })
}
